import HTTP from "http";
import URL from "url";
import LocalProxy from "./LocalProxy.js";

export default class HTTPServer {

    #port;

    #sockets = new Map();

    #recievers = new Map();

    #localProxies = new Map();

    constructor(port, enableCors = false, logRequests = false) {
        const server = HTTP.createServer();
        server.listen(port);
        this.#port = server.address().port;
        server.on("request", async (request, response) => {
            const location = URL.parse(request.url, true);
            const urlPath = location.pathname;
            const pathName = `/${urlPath.replace(/(^\/|\/$)/g, "")}`;
            const method = request.method.toUpperCase();
            try {
                const proxy = this.#getLocalProxy(pathName, request);
                if (proxy != null) {
                    console.log(`[WebService:${this.#port.toString()}] pass request through proxy ${proxy.instanceName}: ${pathName}`);
                    proxy.handleRequest(request, response);
                    return;
                }
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
                    const res = await this.#callReciever(pathName, method, query, body, cookies);
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
        });
        server.on("upgrade", (request, socket, head) => {
            const location = URL.parse(request.url, true);
            const urlPath = location.pathname;
            const pathName = `/${urlPath.replace(/(^\/|\/$)/g, "")}`;
            if (logRequests) {
                console.log(`[WebService:${this.#port.toString()}] requesting upgrade => ${pathName}`);
            }
            if (!this.#sockets.has(pathName)) {
                socket.destroy();
            } else {
                const wss = this.#sockets.get(pathName);
                wss.handleUpgrade(request, socket, head);
            }
        });
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

    registerLocalProxy(path, proxy) {
        if (!(proxy instanceof LocalProxy)) {
            throw new TypeError("proxy has to be an instance of Proxy");
        }
        if (!this.#localProxies.has(path)) {
            this.#localProxies.set(path, proxy);
        }
    }

    unregisterLocalProxy(path) {
        this.#localProxies.delete(path);
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
        const params = [];
        while (path.length) {
            const uri = `/${path.join("/")}`;
            if (this.#recievers.has(uri)) {
                const reciever = this.#recievers.get(uri);
                return await reciever(method, params, query, body);
            }
            params.unshift(path.pop());
        }
        if (this.#recievers.has("/")) {
            const reciever = this.#recievers.get("/");
            return await reciever(method, params, query, body);
        }
        console.log(`[WebService:${this.#port.toString()}] no matching reciever`);
        return {status: 404};
    }

}
