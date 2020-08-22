const HTTP = require("http");
const URL = require("url");

function getOptionsHeader(cors) {
    let res = {};
    res['Content-Type'] = 'text/plain; charset=utf-8';
    if (!!cors) {
        res['Access-Control-Allow-Origin'] = '*';
        res['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
        res['Access-Control-Allow-Headers'] = 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
        res['Access-Control-Max-Age'] = '1728000';
    }
    res['Content-Length'] = 0;
    return res;
}

function getHeader(cors, options) {
    let res = {};
    if (options == null) {
        options = {};
    }
    if (options.nocache != null && options.nocache === true) {
        res['Cache-Control'] = 'no-cache, no-store, must-revalidate';
        res['Expires'] = '-1';
    }
    if (options.type != null) {
        res['Content-Type'] = options.type;
    } else {
        res['Content-Type'] = 'text/plain; charset=utf-8';
    }
    if (options.length != null) {
        res['Content-Length'] = options.length;
    }
    if (options.language != null) {
        res['Content-Language'] = options.language;
    }
    if (!!cors) {
        res['Access-Control-Allow-Origin'] = '*';
        res['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
        res['Access-Control-Allow-Headers'] = 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
        res['Access-Control-Expose-Headers'] = 'Content-Length,Content-Range';
    }
    return res;
}

function getRequestBody(request) {
    return new Promise(function (resolve, reject) {
        let res = "";
        request.on('error', (err) => {
            reject(err);
        }).on('data', (chunk) => {
            res += chunk;
        }).on('end', async () => {
            resolve(res);
        });
    });
}

async function callReciever(recievers, path, method, query, body) {
    path = path.replace(/(^\/|\/$)/g, "");
    let parts = path.split("/").map(p => decodeURI(p));
    let params = [];
    while (!!parts.length) {
        let uri = `/${parts.join("/")}`;
        if (recievers.has(uri)) {
            let reciever = recievers.get(uri);
            return await reciever(method, params, query, body);
        }
        params.unshift(parts.pop());
    }
    return {status: 404};
}

class HTTPServer {

    #sockets = new Map();
    #recievers = new Map();

    constructor(port, enableCors = false) {
        let server = HTTP.createServer();
        server.listen(port);
        server.on('request', async (request, response) => {
            const location = URL.parse(request.url, true);
            const method = request.method.toUpperCase();
            try {
                if (method == "OPTIONS") {
                    response.writeHead(204, getOptionsHeader(enableCors));
                    response.end();
                } else {
                    const headers = request.headers;
                    const pathname = location.pathname;
                    const query = location.query;
                    // parse body
                    let body = null;
                    if (method == "POST" || method == "PUT") {
                        body = await getRequestBody(request);
                        if (headers['content-type'].indexOf('application/json') >= 0) {
                            try {
                                body = JSON.parse(body);
                            } catch (e) {
                                console.log(e);
                            }
                        }
                    }
                    // parse cookies
                    let cookies = {};
                    if (request.headers.cookie != null) {
                        request.headers.cookie.split(";").forEach(function(cookie) {
                            var parts = cookie.split('=');
                            cookies[parts.shift().trim()] = decodeURI(parts.join('='));
                        });
                    }
                    // call the reciever that matches most specific
                    let res = await callReciever(this.#recievers, pathname, method, query, body, cookies);
                    if (res != null && res.status != null) {
                        if (res.content != null) {
                            response.writeHead(res.status, getHeader(enableCors, res.options));
                            response.end(res.content);
                        } else if (res.stream != null) {
                            response.writeHead(res.status, getHeader(enableCors, res.options));
                            res.stream.pipe(response);
                        } else if (res.json != null) {
                            response.writeHead(res.status, getHeader(enableCors, {
                                type: "application/json; charset=utf-8",
                            }));
                            response.end(JSON.stringify(res.json));
                        } else {
                            response.writeHead(res.status, getHeader(enableCors, res.options));
                            response.end();
                        }
                    } else {
                        throw new Error("response without status returned from service reciever");
                    }
                }
            } catch (e) {
                console.log(`ERROR during response for ${request.url}`, e);
                response.writeHead(500, getHeader(enableCors, {
                    type: "application/json; charset=utf-8",
                }));
                response.end(JSON.stringify({
                    url: request.url,
                    error: e
                }));
            }
        });
        server.on('upgrade', (request, socket, head) => {
            let pathname = URL.parse(request.url).pathname;
            pathname = `/${pathname.replace(/(^\/|\/$)/g, "")}`;
            if (this.#sockets.has(pathname)) {
                let wss = this.#sockets.get(pathname);
                wss.handleUpgrade(request, socket, head);
            } else {
                socket.destroy();
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

}

module.exports = HTTPServer;