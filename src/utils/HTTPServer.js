import HTTP from "http";
import LoggableMixin from "../mixins/LoggableMixin.js";
import WebSocketManager from "./manager/WebSocketManager.js";
import ReceiverManager from "./manager/ReceiverManager.js";
import LocalProxyManager from "./manager/LocalProxyManager.js";
import RewriteRuleManager from "./manager/RewriteRuleManager.js";
import {
    createOptionsHeader, createHeader
} from "./helper/Header.js";
import Response from "../http/Response.js";
import Request from "../http/Request.js";
import SessionManager from "./manager/SessionManager.js";

export default class HTTPServer extends LoggableMixin() {

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
            enableCors = false, logRequests = false, useSessions = false
        } = options ?? {};
        this.#port = server.address().port;
        this.#enableCors = !!enableCors;
        this.#logRequests = !!logRequests;
        this.#useSessions = !!useSessions;
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
        const originalRequest = new Request(serverRequest);
        const response = new Response(serverResponse);

        let session;
        // session handling
        if (this.#useSessions) {
            session = originalRequest.getSession();
            if (session == null) {
                session = SessionManager.createSession();
            }
            response.writeSession(session);
        }

        try {
            if (this.#logRequests) {
                this.logger.log("--- START REQUEST ---");
                this.logger.log(`request path: ${originalRequest.originalPath}`);
            }
            const proxy = this.#localProxyManager.get(originalRequest.originalPath);
            if (proxy != null) {
                if (this.#logRequests) {
                    this.logger.log(`pass request through proxy ${proxy.instanceName}: ${originalRequest.originalPath}`);
                }
                proxy.handleRequest(serverRequest, serverResponse, this.#enableCors);
                return;
            }
            const rewrittenPath = this.#rewriteRuleManager.rewrite(originalRequest.originalPath);
            const request = originalRequest.redirectInternal(rewrittenPath);
            if (this.#logRequests) {
                this.logger.log(`requesting ${request.method} => ${request.location.pathname}`);
            }
            if (request.method === "OPTIONS") {
                response.setStatusCode(204)
                    .setHeaders(createOptionsHeader(this.#enableCors))
                    .writeHead()
                    .send();
            } else {
                const res = await this.#receiverManager.execute(request);
                response.setStatusCode(res.status ?? 200)
                    .setHeaders(createHeader(this.#enableCors, res.options));
                if (res.content != null) {
                    response.write(res.content)
                        .send();
                } else if (res.stream != null) {
                    response.sendStream(res.stream);
                } else if (res.json != null) {
                    response.setHeader("Content-Type", "application/json; charset=utf-8")
                        .write(JSON.stringify(res.json))
                        .send();
                }
                if (this.#logRequests) {
                    this.logger.log("--- END REQUEST ---");
                    this.logger.log("");
                }
            }
        } catch (err) {
            this.logger.log(`ERROR during response => ${originalRequest.location.pathname}`);
            console.error(err);
            response.setStatusCode(500)
                .setHeaders(createHeader(this.#enableCors, {type: "application/json; charset=utf-8"}))
                .write(JSON.stringify({
                    url: originalRequest.url,
                    error: err
                }))
                .send();
        }
    }

    #handleUpgrade(serverRequest, socket, head) {
        const request = new Request(serverRequest);
        const rewrittenPath = this.#rewriteRuleManager.rewrite(request.originalPath);

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

    get port() {
        return this.#port;
    }

}
