import HTTP from "http";
import {URL} from "url";
import LoggableMixin from "../mixins/LoggableMixin.js";
import WebSocketManager from "./manager/WebSocketManager.js";
import ReceiverManager from "./manager/ReceiverManager.js";
import LocalProxyManager from "./manager/LocalProxyManager.js";
import RewriteRuleManager from "./manager/RewriteRuleManager.js";
import { createOptionsHeader, createHeader } from "./helper/Header.js";
import { resolveRequestBody } from "./helper/Request.js";

const PATH_MATCHER_REGEXP = /^\/(?:(?:(?:[^{}/]+|\{[a-zA-Z0-9_]+\})\/)*(?:[^{}/]+|\{[a-zA-Z0-9_]+\}))?$/;
const PATH_PARAM_REGEXP = /\{([a-zA-Z0-9_]+)\}/g;
const PATH_PARAM_REPLACE = "(?<$1>[^/]+)";

export default class HTTPServer extends LoggableMixin() {

    #port;

    #enableCors = false;

    #logRequests = false;

    #webSocketManager = new WebSocketManager();

    #receiverManager = new ReceiverManager();

    #rewriteRuleManager = new RewriteRuleManager();

    #localProxyManager = new LocalProxyManager();

    constructor(port, enableCors = false, logRequests = false) {
        super();
        const server = HTTP.createServer();
        server.listen(port);
        this.#port = server.address().port;
        this.#enableCors = enableCors;
        this.#logRequests = logRequests;
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

    async #handleRequest(request, response) {
        const location = new URL(request.url, "http://localhost");
        const urlPath = location.pathname;
        const originalPath = `/${urlPath.replace(/(^\/|\/$)/g, "")}`;
        const method = request.method.toUpperCase();
        try {
            if (this.#logRequests) {
                this.logger.log("--- START REQUEST ---");
                this.logger.log(`request path: ${originalPath}`);
            }
            const proxy = this.#localProxyManager.get(originalPath);
            if (proxy != null) {
                if (this.#logRequests) {
                    this.logger.log(`pass request through proxy ${proxy.instanceName}: ${originalPath}`);
                }
                proxy.handleRequest(request, response, this.#enableCors);
                return;
            }
            const rewrittenPath = this.#rewriteRuleManager.rewrite(originalPath);
            if (method === "OPTIONS") {
                if (this.#logRequests) {
                    this.logger.log("requesting OPTIONS");
                }
                response.writeHead(204, createOptionsHeader(this.#enableCors));
                response.end();
            } else {
                const headers = request.headers;
                const query = location.query;
                if (this.#logRequests) {
                    this.logger.log(`requesting ${method} => ${location.pathname}`);
                }
                // parse body
                const body = await resolveRequestBody(request);
                // parse cookies
                const cookies = {};
                if (headers.cookie != null) {
                    headers.cookie.split(";").forEach(function(cookie) {
                        const parts = cookie.split("=");
                        cookies[parts.shift().trim()] = decodeURI(parts.join("="));
                    });
                }
                // call the receiver that matches most specific
                const res = await this.#receiverManager.execute(rewrittenPath, method, query, body, cookies);
                if (res != null && res.status != null) {
                    if (res.content != null) {
                        response.writeHead(res.status, createHeader(this.#enableCors, res.options));
                        response.end(res.content);
                    } else if (res.stream != null) {
                        response.writeHead(res.status, createHeader(this.#enableCors, res.options));
                        res.stream.pipe(response);
                    } else if (res.json != null) {
                        response.writeHead(res.status, createHeader(this.#enableCors, {type: "application/json; charset=utf-8"}));
                        response.end(JSON.stringify(res.json));
                    } else {
                        response.writeHead(res.status, createHeader(this.#enableCors, res.options));
                        response.end();
                    }
                    if (this.#logRequests) {
                        this.logger.log("--- END REQUEST ---");
                        this.logger.log("");
                    }
                } else {
                    throw new Error("response without status returned from service receiver");
                }
            }
        } catch (err) {
            this.logger.log(`ERROR during response => ${request.url}`);
            console.error(err);
            response.writeHead(500, createHeader(this.#enableCors, {type: "application/json; charset=utf-8"}));
            response.end(JSON.stringify({
                url: request.url,
                error: err
            }));
        }
    }

    #handleUpgrade(request, socket, head) {
        const location = URL.parse(request.url, true);
        const urlPath = location.pathname;
        const originalPath = `/${urlPath.replace(/(^\/|\/$)/g, "")}`;

        const rewrittenPath = this.#rewriteRuleManager.rewrite(originalPath);
        if (this.#logRequests) {
            this.logger.log(`requesting upgrade => ${rewrittenPath}`);
        }
        const wss = this.#webSocketManager.resolve(rewrittenPath);
        if (wss == null) {
            socket.destroy();
        } else {
            wss.handleUpgrade(request, socket, head);
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
        const res = this.#rewriteRuleManager.add(rule);
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
