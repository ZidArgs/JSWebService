import HTTP from "http";
import URL from "url";
import AccessVerifier from "./access/AccessVerifier.js";

export default class HTTPServer {

    #port;

    #sockets = new Map();

    #recievers = new Map();

    #accessManager;

    constructor(port, enableCors = false, logRequests = false) {
        const server = HTTP.createServer();
        server.listen(port);
        this.#port = server.address().port;
        server.on("request", async (request, response) => {
            if (this.#checkPermission(request)) {
                console.log(`[WebService:${this.#port.toString()}] access violation => ${request.url}`);
                response.writeHead(403, this.#getHeader(enableCors, {type: "application/json; charset=utf-8"}));
                response.end(JSON.stringify({
                    url: request.url,
                    error: "access violation"
                }));
            } else {
                const location = URL.parse(request.url, true);
                const urlPath = location.pathname;
                const pathName = `/${urlPath.replace(/(^\/|\/$)/g, "")}`;
                const method = request.method.toUpperCase();
                try {
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
                        const res = await this.#callReciever(this.#recievers, pathName, method, query, body, cookies);
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
            }
        });
        server.on("upgrade", (request, socket, head) => {
            const location = URL.parse(request.url, true);
            const urlPath = location.pathname;
            const pathName = `/${urlPath.replace(/(^\/|\/$)/g, "")}`;
            if (logRequests) {
                console.log(`[WebService:${this.#port.toString()}] requesting upgrade => ${pathName}`);
            }
            if (!this.#sockets.has(pathName) || this.#checkPermission(request)) {
                socket.destroy();
            } else {
                const wss = this.#sockets.get(pathName);
                wss.handleUpgrade(request, socket, head);
            }
        });
    }

    setAccessManager(accessManager) {
        if (accessManager != null) {
            if (!(accessManager instanceof AccessVerifier)) {
                throw new TypeError("accessManager has to be an instance of AccessManager or null");
            }
            this.#accessManager = accessManager;
            console.log(`[WebService:${this.port.toString().padEnd(5)}] set access manager: ${this.#accessManager.instanceName}`);
        } else {
            this.#accessManager = null;
            console.log(`[WebService:${this.port.toString().padEnd(5)}] remove access manager`);
        }
    }

    addWebSocket(path, wss) {
        if (!this.#sockets.has(path)) {
            this.#sockets.set(path, wss);
        }
    }

    removeWebSocket(path) {
        this.#sockets.delete(path);
    }

    addReciever(path, reciever) {
        if (!this.#recievers.has(path)) {
            this.#recievers.set(path, reciever);
        }
    }

    removeReciever(path) {
        this.#recievers.delete(path);
    }

    get port() {
        return this.#port;
    }

    #checkPermission(request) {
        return this.#accessManager != null && !this.#accessManager.checkAccess(request);
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

    async #callReciever(recievers, pathName, method, query, body) {
        pathName = pathName.replace(/(^\/|\/$)/g, "");
        const path = pathName.split("/").map((p) => decodeURI(p));
        const params = [];
        while (path.length) {
            const uri = `/${path.join("/")}`;
            if (recievers.has(uri)) {
                const reciever = recievers.get(uri);
                return await reciever(method, params, query, body);
            }
            params.unshift(path.pop());
        }
        if (recievers.has("/")) {
            const reciever = recievers.get("/");
            return await reciever(method, params, query, body);
        }
        return {status: 404};
    }

}
