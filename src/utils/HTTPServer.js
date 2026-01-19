import HTTP from "http";
import LoggableMixin from "../mixins/LoggableMixin.js";
import WebSocketManager from "./manager/WebSocketManager.js";
import ReceiverManager from "./manager/ReceiverManager.js";
import LocalProxyManager from "./manager/LocalProxyManager.js";
import RewriteRuleManager from "./manager/RewriteRuleManager.js";
import {
    createOptionsHeader, createHeader
} from "./helper/Header.js";
import {trimPathName} from "./helper/UriPath.js";
import Request from "../http/Request.js";
import Response from "../http/Response.js";

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
        if (typeof basePath === "string" && basePath !== "") {
            this.#basePath = `/${trimPathName(basePath)}/`;
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
            request = request.redirectInternal(rewrittenPath);
            if (this.#logRequests) {
                this.logger.log(`requesting ${request.method} => ${request.location.pathname}`);
            }
            if (request.method === "OPTIONS") {
                this.#maybeWriteSession(request, response);
                response.setStatusCode(204)
                    .setHeaders(createOptionsHeader(this.#enableCors))
                    .send();
            } else {
                const res = await this.#receiverManager.execute(request);
                this.#maybeWriteSession(request, response);
                // TODO use error code handler if registered into ErrorCodeManager
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
                    response.setHeader("Content-Type", "application/json; charset=utf-8")
                        .send(JSON.stringify(res.json));
                } else {
                    if (this.#logRequests) {
                        this.logger.log("empty response");
                    }
                    response.send();
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
                .setHeaders(createHeader(this.#enableCors, {type: "application/json; charset=utf-8"}))
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

    #maybeWriteSession(request, response) {
        if (this.#useSessions) {
            const session = request.session;
            if (request.isNewSession) { // TODO add option for session refresh
                response.writeSession(session);
            }
        }
    }

}
