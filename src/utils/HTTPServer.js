import HTTP from "http";
import URL from "url";
import LocalProxy from "./LocalProxy.js";

const PATH_MATCHER_REGEXP = /^\/(?:(?:(?:[^{}/]+|\{[a-zA-Z0-9_]+\})\/)*(?:[^{}/]+|\{[a-zA-Z0-9_]+\}))?$/;
const PATH_PARAM_REGEXP = /\{([a-zA-Z0-9_]+)\}/g;
const PATH_PARAM_REPLACE = "(?<$1>[^/]+)";

export default class HTTPServer {

    #port;

    #sockets = new Map();

    #recievers = new Map();

    #rewriteRules = new Set();

    #localProxies = new Map();

    constructor(port, enableCors = false, logRequests = false) {
        const server = HTTP.createServer();
        server.listen(port);
        this.#port = server.address().port;
        server.on("request", async (request, response) => {
            const location = URL.parse(request.url, true);
            const urlPath = location.pathname;
            const originalPath = `/${urlPath.replace(/(^\/|\/$)/g, "")}`;
            const method = request.method.toUpperCase();
            try {
                if (logRequests) {
                    console.log("--- START REQUEST ---");
                    console.log(`[WebService:${this.#port.toString()}] request path: ${originalPath}`);
                }
                const proxy = this.#getLocalProxy(originalPath, request);
                if (proxy != null) {
                    if (logRequests) {
                        console.log(`[WebService:${this.#port.toString()}] pass request through proxy ${proxy.instanceName}: ${originalPath}`);
                    }
                    proxy.handleRequest(request, response);
                    return;
                }
                const rewrittenPath = this.#rewritePath(originalPath);
                if (method === "OPTIONS") {
                    if (logRequests) {
                        console.log(`[WebService:${this.#port.toString()}] requesting OPTIONS`);
                    }
                    response.writeHead(204, this.#getOptionsHeader(enableCors));
                    response.end();
                } else {
                    const headers = request.headers;
                    const query = location.query;
                    if (logRequests) {
                        console.log(`[WebService:${this.#port.toString()}] requesting ${method} => ${location.pathname}`);
                    }
                    // parse body
                    const body = await this.#resolveRequestBody(request);
                    // parse cookies
                    const cookies = {};
                    if (headers.cookie != null) {
                        headers.cookie.split(";").forEach(function(cookie) {
                            const parts = cookie.split("=");
                            cookies[parts.shift().trim()] = decodeURI(parts.join("="));
                        });
                    }
                    // call the reciever that matches most specific
                    const res = await this.#callReciever(rewrittenPath, method, query, body, cookies);
                    if (res != null && res.status != null) {
                        if (res.content != null) {
                            response.writeHead(res.status, this.#getHeader(enableCors, res.options));
                            response.end(res.content);
                        } else if (res.stream != null) {
                            response.writeHead(res.status, this.#getHeader(enableCors, res.options));
                            res.stream.pipe(response);
                        } else if (res.json != null) {
                            response.writeHead(res.status, this.#getHeader(enableCors, {type: "application/json; charset=utf-8"}));
                            response.end(JSON.stringify(res.json));
                        } else {
                            response.writeHead(res.status, this.#getHeader(enableCors, res.options));
                            response.end();
                        }
                        if (logRequests) {
                            console.log("--- END REQUEST ---");
                            console.log("");
                        }
                    } else {
                        throw new Error("response without status returned from service reciever");
                    }
                }
            } catch (err) {
                console.log(`[WebService:${this.#port.toString()}] ERROR during response => ${request.url}`);
                console.error(err);
                response.writeHead(500, this.#getHeader(enableCors, {type: "application/json; charset=utf-8"}));
                response.end(JSON.stringify({
                    url: request.url,
                    error: err
                }));
            }
        });
        server.on("upgrade", (request, socket, head) => {
            const location = URL.parse(request.url, true);
            const urlPath = location.pathname;
            const originalPath = `/${urlPath.replace(/(^\/|\/$)/g, "")}`;

            const rewrittenPath = this.#rewritePath(originalPath);
            if (logRequests) {
                console.log(`[WebService:${this.#port.toString()}] requesting upgrade => ${rewrittenPath}`);
            }
            const wss = this.#resolveWebSocket(rewrittenPath);
            if (wss == null) {
                socket.destroy();
            } else {
                wss.handleUpgrade(request, socket, head);
            }
        });
    }

    addWebSocket(path, wss) {
        if (!this.#sockets.has(path)) {
            if (PATH_MATCHER_REGEXP.test(path)) {
                const params = [...path.match(PATH_PARAM_REGEXP) ?? []].map((p) => p.slice(1, -1));
                const matcher = new RegExp(`^${path.replace(PATH_PARAM_REGEXP, PATH_PARAM_REPLACE)}$`);

                this.#sockets.set(path, {
                    wss,
                    params,
                    matcher
                });

                console.log(`[WebService:${this.#port.toString()}] add websocket: "${path}" -> ${matcher} [${params.join(",")}]`);
            } else {
                throw new Error(`can not register websocket: "${path}" does not match pattern`);
            }
        }
    }

    removeWebSocket(path) {
        this.#sockets.delete(path);
    }

    addReciever(path, reciever) {
        if (!this.#recievers.has(path)) {
            if (PATH_MATCHER_REGEXP.test(path)) {
                const params = [...path.match(PATH_PARAM_REGEXP) ?? []].map((p) => p.slice(1, -1));
                const matcher = new RegExp(`^${path.replace(PATH_PARAM_REGEXP, PATH_PARAM_REPLACE)}$`);

                this.#recievers.set(path, {
                    reciever,
                    params,
                    matcher
                });

                console.log(`[WebService:${this.#port.toString()}] add reciever: "${path}" -> ${matcher} [${params.join(",")}]`);
            } else {
                throw new Error(`can not register reciever: "${path}" does not match pattern`);
            }
        }
    }

    removeReciever(path) {
        this.#recievers.delete(path);
    }

    addRewriteRule(rule) {
        if (typeof rule !== "object" || Array.isArray(rule)) {
            throw new TypeError("dict expected");
        }

        const {conditions, matcher, rewrite} = rule;

        if (!(matcher instanceof RegExp || typeof matcher === "string") || matcher === "") {
            throw new Error("mandatory property \"matcher\" must be a RegExp or a non empty string");
        }
        if (typeof rewrite !== "string" || rewrite === "") {
            throw new Error("mandatory property \"rewrite\" must be a non empty string");
        }
        if (conditions != null) {
            if (!Array.isArray(conditions)) {
                throw new Error("optional property \"conditions\" must be an array");
            }
            for (const condition of conditions) {
                if (!(condition instanceof RegExp || typeof condition === "string") || condition === "") {
                    throw new Error("all conditions must be a RegExp or a non empty string");
                }
            }
        }

        const res = {
            conditions: [],
            matcher: null,
            rewrite: rule.rewrite
        };

        if (!(matcher instanceof RegExp)) {
            res.matcher = new RegExp(matcher);
        } else {
            res.matcher = matcher;
        }

        for (const condition of conditions) {
            if (!(condition instanceof RegExp)) {
                res.conditions.push(new RegExp(condition));
            } else {
                res.conditions.push(condition);
            }
        }

        console.log(`[WebService:${this.#port.toString()}] register rewrite: [${res.conditions.join(",")}] ${res.matcher} => "${res.rewrite}"`);

        this.#rewriteRules.add(res);
    }

    registerLocalProxy(path, proxy) {
        if (!(proxy instanceof LocalProxy)) {
            throw new TypeError("proxy has to be an instance of Proxy");
        }
        if (!this.#localProxies.has(path)) {
            this.#localProxies.set(path, proxy);
        }
    }

    get port() {
        return this.#port;
    }

    #getOptionsHeader(cors) {
        const res = {};
        res["Content-Type"] = "text/plain; charset=utf-8";
        if (cors) {
            res["Access-Control-Allow-Origin"] = "*";
            res["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS";
            res["Access-Control-Allow-Headers"] = "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range";
            res["Access-Control-Max-Age"] = "1728000";
        }
        res["Content-Length"] = 0;
        return res;
    }

    #getHeader(cors, options) {
        const res = {};
        if (options == null) {
            options = {};
        }
        if (options.nocache != null && options.nocache === true) {
            res["Cache-Control"] = "no-cache, no-store, must-revalidate";
            res["Expires"] = "-1";
        }
        if (options.type != null) {
            res["Content-Type"] = options.type;
        } else {
            res["Content-Type"] = "text/plain; charset=utf-8";
        }
        if (options.length != null) {
            res["Content-Length"] = options.length;
        }
        if (options.language != null) {
            res["Content-Language"] = options.language;
        }
        if (cors) {
            res["Access-Control-Allow-Origin"] = "*";
            res["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS";
            res["Access-Control-Allow-Headers"] = "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range";
            res["Access-Control-Expose-Headers"] = "Content-Length,Content-Range";
        }
        return res;
    }

    async #resolveRequestBody(request) {
        const result = await this.#getRequestBody(request);
        if (result.length) {
            try {
                return JSON.parse(result);
            } catch {
                return result;
            }
        }
        return result;
    }

    #getRequestBody(request) {
        return new Promise(function(resolve, reject) {
            const res = [];
            request.on("error", (err) => {
                reject(err);
            }).on("data", (chunk) => {
                res.push(chunk);
            }).on("end", async () => {
                resolve(res.join(""));
            });
        });
    }

    #rewritePath(pathName) {
        for (const rule of this.#rewriteRules) {
            const {conditions, matcher, rewrite} = rule;
            console.log(`[WebService:${this.#port.toString()}] testing rewrite: [${conditions.join(",")}] ${matcher} => "${rewrite}"`);
            if (this.#matchesRuleConditions(conditions, pathName)) {
                const result = pathName.replace(matcher, rewrite);
                console.log(`[WebService:${this.#port.toString()}] rewriting path: "${pathName}" => "${result}"`);
                return result;
            }
        }
        return pathName;
    }

    #matchesRuleConditions(conditions, pathName) {
        for (const condition of conditions) {
            if (!condition.test(pathName)) {
                return false;
            }
        }
        return true;
    }

    #getLocalProxy(pathName) {
        pathName = pathName.replace(/(^\/|\/$)/g, "");
        const path = pathName.split("/").map((p) => decodeURI(p));
        while (path.length) {
            const uri = `/${path.join("/")}`;
            if (this.#localProxies.has(uri)) {
                return this.#localProxies.get(uri);
            }
            path.pop();
        }
        if (this.#localProxies.has("/")) {
            return this.#localProxies.get("/");
        }
        return null;
    }

    async #callReciever(pathName, method, query, body) {
        if (this.#recievers.size == 0) {
            console.log(`[WebService:${this.#port.toString()}] no reciever registered`);
            return {status: 404};
        }
        pathName = pathName.replace(/(^\/|\/$)/g, "");
        const path = pathName.split("/").map((p) => decodeURI(p));
        const restPath = [];
        while (path.length) {
            const uri = `/${path.join("/")}`;
            for (const [, config] of this.#recievers) {
                const match = uri.match(config.matcher);
                if (match != null) {
                    const params = {
                        "@restPath": restPath.join("/"),
                        "@fullPath": `/${pathName}`,
                        "@path": uri
                    };
                    for (const key of config.params) {
                        params[key] = match.groups?.[key];
                    }
                    return await config.reciever(method, params, query, body);
                }
            }
            restPath.unshift(path.pop());
        }
        if (this.#recievers.has("/")) {
            const config = this.#recievers.get("/");
            const params = {
                "@restPath": restPath.join("/"),
                "@fullPath": `/${pathName}`,
                "@path": "/"
            };
            return await config.reciever(method, params, query, body);
        }
        console.log(`[WebService:${this.#port.toString()}] no matching reciever`);
        return {status: 404};
    }

    #resolveWebSocket(pathName) {
        if (this.#sockets.size == 0) {
            console.log(`[WebService:${this.#port.toString()}] no websocket registered`);
            return;
        }
        pathName = pathName.replace(/(^\/|\/$)/g, "");
        const path = pathName.split("/").map((p) => decodeURI(p));
        while (path.length) {
            const uri = `/${path.join("/")}`;
            for (const [, config] of this.#sockets) {
                const match = uri.match(config.matcher);
                if (match != null) {
                    return config.wss;
                }
            }
            path.pop();
        }
        if (this.#sockets.has("/")) {
            const config = this.#sockets.get("/");
            return config.wss;
        }
        console.log(`[WebService:${this.#port.toString()}] no matching websocket`);
    }

}
