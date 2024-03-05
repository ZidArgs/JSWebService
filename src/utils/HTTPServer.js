import HTTP from "http";
import URL from "url";
import AccessManager from "./manager/AccessManager.js";

function getOptionsHeader(cors) {
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

function getHeader(cors, options) {
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

async function getRequestBody(request, method, headers) {
    if (method == "POST" || method == "PUT") {
        const result = new Promise(function(resolve, reject) {
            const res = [];
            request.on("error", (err) => {
                reject(err);
            }).on("data", (chunk) => {
                res.push(chunk);
            }).on("end", async () => {
                resolve(res.join(""));
            });
        });
        if (headers["content-type"].indexOf("application/json") >= 0) {
            try {
                return JSON.parse(result);
            } catch (err) {
                console.error(err);
                return result;
            }
        }
        return result;
    }
    return null;
}

async function callReciever(recievers, path, method, query, body) {
    path = path.replace(/(^\/|\/$)/g, "");
    const parts = path.split("/").map((p) => decodeURI(p));
    const params = [];
    while (parts.length) {
        const uri = `/${parts.join("/")}`;
        if (recievers.has(uri)) {
            const reciever = recievers.get(uri);
            return await reciever(method, params, query, body);
        }
        params.unshift(parts.pop());
    }
    if (recievers.has("/")) {
        const reciever = recievers.get("/");
        return await reciever(method, params, query, body);
    }
    return {status: 404};
}

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
            const location = URL.parse(request.url, true);
            const urlPath = location.pathname;
            const pathname = `/${urlPath.replace(/(^\/|\/$)/g, "")}`;
            if (this.#accessManager != null && !this.#accessManager.checkAccess(pathname)) {
                console.log(`[WebService:${this.#port.toString()}] access violation => ${request.url}`);
                response.writeHead(403, getHeader(enableCors, {type: "application/json; charset=utf-8"}));
                response.end(JSON.stringify({
                    url: request.url,
                    error: "access violation"
                }));
            } else {
                const method = request.method.toUpperCase();
                try {
                    if (method === "OPTIONS") {
                        if (logRequests) {
                            console.log(`[WebService:${this.#port.toString()}] requesting OPTIONS`);
                        }
                        response.writeHead(204, getOptionsHeader(enableCors));
                        response.end();
                    } else {
                        const headers = request.headers;
                        const query = location.query;
                        if (logRequests) {
                            console.log(`[WebService:${this.#port.toString()}] requesting ${method} => ${location.pathname}`);
                        }
                        // parse body
                        const body = await getRequestBody(request, method, headers);
                        // parse cookies
                        const cookies = {};
                        if (request.headers.cookie != null) {
                            request.headers.cookie.split(";").forEach(function(cookie) {
                                const parts = cookie.split("=");
                                cookies[parts.shift().trim()] = decodeURI(parts.join("="));
                            });
                        }
                        // call the reciever that matches most specific
                        const res = await callReciever(this.#recievers, pathname, method, query, body, cookies);
                        if (res != null && res.status != null) {
                            if (res.content != null) {
                                response.writeHead(res.status, getHeader(enableCors, res.options));
                                response.end(res.content);
                            } else if (res.stream != null) {
                                response.writeHead(res.status, getHeader(enableCors, res.options));
                                res.stream.pipe(response);
                            } else if (res.json != null) {
                                response.writeHead(res.status, getHeader(enableCors, {type: "application/json; charset=utf-8"}));
                                response.end(JSON.stringify(res.json));
                            } else {
                                response.writeHead(res.status, getHeader(enableCors, res.options));
                                response.end();
                            }
                        } else {
                            throw new Error("response without status returned from service reciever");
                        }
                    }
                } catch (err) {
                    console.log(`[WebService:${this.#port.toString()}] ERROR during response => ${request.url}`);
                    console.error(err);
                    response.writeHead(500, getHeader(enableCors, {type: "application/json; charset=utf-8"}));
                    response.end(JSON.stringify({
                        url: request.url,
                        error: err
                    }));
                }
            }
        });
        server.on("upgrade", (request, socket, head) => {
            const location = URL.parse(request.url, true);
            if (logRequests) {
                console.log(`[WebService:${this.#port.toString()}] requesting upgrade => ${location.pathname}`);
            }
            const urlPath = location.pathname;
            const pathname = `/${urlPath.replace(/(^\/|\/$)/g, "")}`;
            if (!this.#sockets.has(pathname) || (this.#accessManager != null && !this.#accessManager.checkAccess(pathname))) {
                socket.destroy();
            } else {
                const wss = this.#sockets.get(pathname);
                wss.handleUpgrade(request, socket, head);
            }
        });
    }

    setAccessManager(accessManager) {
        if (accessManager != null) {
            if (!(accessManager instanceof AccessManager)) {
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

}
