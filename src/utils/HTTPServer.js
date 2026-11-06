import HTTP from "http";
import HTTPHeader from "@emcjs/core/enum/http/HTTPHeader.js";
import ContentType from "../http/enum/ContentType.js";
import LoggableMixin from "../mixins/LoggableMixin.js";
import WebSocketManager from "./manager/WebSocketManager.js";
import ReceiverManager from "./manager/ReceiverManager.js";
import LocalProxyManager from "./manager/LocalProxyManager.js";
import RewriteRuleManager from "./manager/RewriteRuleManager.js";
import PermissionManager from "./manager/PermissionManager.js";
import {
    createOptionsHeader, createHeader
} from "./header/CreateHeader.js";
import {trimPathName} from "./helper/UriPath.js";
import Request from "../http/Request.js";
import Response from "../http/Response.js";
import FilterManager from "./manager/FilterManager.js";

// TODO add ErrorCodeManager to handle specific error codes
export default class HTTPServer extends LoggableMixin() {

    #basePath = "/";

    #port;

    #enableCors = false;

    #logRequests = false;

    #useSessions = false;

    #webSocketManager = new WebSocketManager();

    #receiverManager = new ReceiverManager();

    #rewriteRuleManager = new RewriteRuleManager();

    #localProxyManager = new LocalProxyManager();

    #permissionManager = new PermissionManager();

    #filterManager = new FilterManager();

    constructor(port, options = {}) {
        super();
        const server = HTTP.createServer();
        server.listen(port);
        const {
            enableCors = false, logRequests = false, useSessions = false, basePath
        } = options ?? {};
        this.#port = server.address().port;
        this.#enableCors = !!enableCors;
        this.#logRequests = !!logRequests;
        this.#useSessions = !!useSessions;
        const trimmedBasePath = trimPathName(basePath);
        if (trimmedBasePath !== "") {
            this.#basePath = `/${trimmedBasePath}/`;
        }
        server.on("request", (request, response) => {
            this.#handleRequest(request, response);
        });
        server.on("upgrade", (request, socket, head) => {
            this.#handleUpgrade(request, socket, head);
        });
    }

    set logger(logger) {
        super.logger = logger;
        this.#webSocketManager.logger = this.logger;
        this.#receiverManager.logger = this.logger;
        this.#rewriteRuleManager.logger = this.logger;
        this.#localProxyManager.logger = this.logger;
        this.#permissionManager.logger = this.logger;
        this.#filterManager.logger = this.logger;
    }

    get logger() {
        return super.logger;
    }

    async #handleRequest(serverRequest, serverResponse) {
        let request = new Request(serverRequest);
        const response = new Response(serverResponse);

        const originalPath = request.originalPath;
        if (!originalPath.startsWith(this.#basePath)) {
            this.logger.log(`"${originalPath}" does not match basePath "${this.#basePath}"`);
            response.setStatusCode(404)
                .setHeaders(createHeader(this.#enableCors))
                .send();
            return;
        }

        const requestPath = originalPath.replace(this.#basePath, "/");

        const permissions = this.#permissionManager.get(requestPath);
        if (permissions != null && !permissions.public) {
            // TODO check for role access
            // TODO redirect to login page if it is defined and user is not logged in
            this.logger.log(`permission denied for request => ${requestPath}`);
            response.setStatusCode(403)
                .setHeaders(createHeader(this.#enableCors))
                .send();
            this.logger.log("--- ABORT REQUEST ---");
            this.logger.log("");
            return;
        }

        if (!await this.#filterManager.filter(request, response)) {
            this.logger.log(`filter failed for request => ${requestPath}`);
            if (!response.isFinished()) {
                response.setStatusCode(403)
                    .setHeaders(createHeader(this.#enableCors))
                    .send();
            }
            this.logger.log("--- ABORT REQUEST ---");
            this.logger.log("");
            return;
        }

        try {
            if (this.#logRequests) {
                this.logger.log("--- START REQUEST ---");
                this.logger.log(`request path: ${requestPath}`);
            }
            const proxy = this.#localProxyManager.get(requestPath);
            if (proxy != null) {
                if (this.#logRequests) {
                    this.logger.log(`pass request through proxy ${proxy.instanceName}: ${requestPath}`);
                }
                proxy.handleRequest(serverRequest, serverResponse, this.#enableCors);
                return;
            }
            const rewrittenPath = this.#rewriteRuleManager.rewrite(requestPath);
            if (rewrittenPath !== requestPath) {
                this.logger.log(`internal redirect ${requestPath} => ${rewrittenPath}`);
                request = request.redirectInternal(rewrittenPath);
            }
            if (this.#logRequests) {
                this.logger.log(`requesting ${request.method} => ${request.location.pathname}`);
            }
            if (request.method === "OPTIONS") {
                this.#maybeWriteSession(request, response);
                response.setStatusCode(204)
                    .setHeaders(createOptionsHeader(this.#enableCors))
                    .send();
            } else {
                const res = await this.#receiverManager.execute(request, response);
                this.#maybeWriteSession(request, response);
                // TODO use error code handler if registered into ErrorCodeManager
                if (!response.isFinished()) {
                    response.setStatusCode(res.status ?? 200)
                        .setHeaders(createHeader(this.#enableCors, res.options));
                    if (res.content != null) {
                        if (this.#logRequests) {
                            this.logger.log("responding with plaintext");
                        }
                        response.send(res.content);
                    } else if (res.stream != null) {
                        if (this.#logRequests) {
                            this.logger.log("responding with a stream");
                        }
                        response.send(res.stream);
                    } else if (res.json != null) {
                        if (this.#logRequests) {
                            this.logger.log("responding with json");
                        }
                        response.setHeader(HTTPHeader.CONTENT_TYPE, ContentType.APPLICATION_JSON_UTF8)
                            .send(JSON.stringify(res.json));
                    } else {
                        if (this.#logRequests) {
                            this.logger.log("empty response");
                        }
                        response.send();
                    }
                } else if (this.#logRequests) {
                    this.logger.log("response already send");
                }
                if (this.#logRequests) {
                    this.logger.log("--- END REQUEST ---");
                    this.logger.log("");
                }
            }
        } catch (err) {
            this.logger.log(`ERROR during response => ${request.location.pathname}`);
            console.error(err);
            // TODO use error code handler if registered into ErrorCodeManager
            response.setStatusCode(500)
                .setHeaders(createHeader(this.#enableCors, {type: ContentType.APPLICATION_JSON_UTF8}))
                .send(JSON.stringify({
                    url: request.url,
                    error: err
                }));
        }
    }

    #handleUpgrade(serverRequest, socket, head) {
        const request = new Request(serverRequest);

        const originalPath = request.originalPath;
        if (!originalPath.startsWith(this.#basePath)) {
            this.logger.log(`"${originalPath}" does not match basePath "${this.#basePath}"`);
            socket.destroy();
            return;
        }

        const requestPath = originalPath.replace(this.#basePath, "/");

        const permissions = this.#permissionManager.get(requestPath);
        if (permissions != null && !permissions.public) {
            // TODO check for role access
            this.logger.log(`permission denied for socket => ${requestPath}`);
            socket.destroy();
            return;
        }

        const rewrittenPath = this.#rewriteRuleManager.rewrite(requestPath);

        if (this.#logRequests) {
            this.logger.log(`requesting upgrade => ${rewrittenPath}`);
        }
        const wss = this.#webSocketManager.resolve(rewrittenPath);
        if (wss == null) {
            socket.destroy();
        } else {
            wss.handleUpgrade(serverRequest, socket, head);
        }
    }

    addWebSocket(path, wss) {
        this.#webSocketManager.add(path, wss);
    }

    removeWebSocket(path) {
        this.#webSocketManager.delete(path);
    }

    addReceiver(path, receiver) {
        this.#receiverManager.add(path, receiver);
    }

    removeReceiver(path) {
        this.#receiverManager.delete(path);
    }

    addRewriteRule(rule) {
        this.#rewriteRuleManager.add(rule);
    }

    registerLocalProxy(path, proxy) {
        this.#localProxyManager.set(path, proxy);
    }

    removeLocalProxy(path) {
        this.#localProxyManager.delete(path);
    }

    get basePath() {
        return this.#basePath;
    }

    get port() {
        return this.#port;
    }

    get permissions() {
        return this.#permissionManager;
    }

    get filters() {
        return this.#filterManager;
    }

    #maybeWriteSession(request, response) {
        if (this.#useSessions) {
            const session = request.session;
            if (request.isNewSession) { // TODO add option for session refresh
                response.writeSession(session);
            }
        }
    }

}
