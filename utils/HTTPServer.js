const HTTP = require('http');
const URL = require('url');

function getHeader(options = {}) {
    let res = {};
    res['Cache-Control'] = 'no-cache';
    if (typeof options == "object" && !Array.isArray(options)) {
        if (options.method == "OPTIONS") {
            res['Content-Type'] = 'text/plain; charset=utf-8';
            if (!!options.cors) {
                res['Access-Control-Allow-Origin'] = '*';
                res['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
                res['Access-Control-Allow-Headers'] = 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
                res['Access-Control-Max-Age'] = '1728000';
            }
            res['Content-Length'] = 0;
        } else {
            if (!!options.type) {
                res['Content-Type'] = options.type;
            } else {
                res['Content-Type'] = 'text/plain; charset=utf-8';
            }
            if (!!options.cors) {
                res['Access-Control-Allow-Origin'] = '*';
                res['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
                res['Access-Control-Allow-Headers'] = 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
                res['Access-Control-Expose-Headers'] = 'Content-Length,Content-Range';
            }
        }
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

class HTTPServer {

    #sockets = new Map();
    #recievers = new Map();

    constructor(port, enableCors = false) {
        let server = HTTP.createServer().listen(port);
        server.on('request', async (request, response) => {
            const location = URL.parse(request.url, true);
            const method = request.method.toUpperCase();
            try {
                if (method == "OPTIONS") {
                    response.writeHead(204, getHeader({
                        cors: enableCors,
                        method: method
                    }));
                    response.end();
                } else {
                    const headers = request.headers;
                    let body = await getRequestBody(request);
                    if (headers['content-type'] == 'application/json') {
                        try {
                            body = JSON.parse(body);
                        } catch (e) { }
                    }
                    if (this.#recievers.has(location.pathname)) {
                        let reciever = this.#recievers.get(location.pathname);
                        let data = await reciever(method, location.query, body);
                        response.writeHead(200, getHeader({
                            type: 'application/json; charset=utf-8',
                            cors: enableCors,
                            method: method
                        }));
                        response.end(JSON.stringify(data));
                    } else {
                        response.writeHead(404, getHeader({
                            cors: enableCors,
                            method: method
                        }));
                        response.end();
                    }
                }
            } catch (e) {
                console.log("ERROR during response", e);
                response.writeHead(500, getHeader({
                    cors: enableCors,
                    method: method
                }));
                response.end(e);
            }
        });
        server.on('upgrade', (request, socket, head) => {
            const pathname = URL.parse(request.url).pathname;
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