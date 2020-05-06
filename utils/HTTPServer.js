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
                res['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
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
                res['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
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

async function callReciever(recievers, path, method, query, body) {
        let parts = path.replace(/\/$/, "").split("/");
        let params = [];
        while (!!parts.length) {
            let uri = parts.join("/");
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
                    response.writeHead(204, getHeader({
                        cors: enableCors,
                        method: method
                    }));
                    response.end();
                } else {
                    const headers = request.headers;
                    const pathname = location.pathname;
                    const query = location.query;
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
                    // call the reciever that matches most specific
                    let res = await callReciever(this.#recievers, pathname, method, query, body);
                    if (res.data != null) {
                        response.writeHead(res.status, getHeader({
                            type: 'application/json; charset=utf-8',
                            cors: enableCors,
                            method: method
                        }));
                        response.end(JSON.stringify(res.data));
                    } else {
                        response.writeHead(res.status, getHeader({
                            cors: enableCors,
                            method: method
                        }));
                        if (res.text != null) {
                            response.end(res.text);
                        } else {
                            response.end();
                        }
                    }
                }
            } catch (e) {
                console.log("ERROR during response", e);
                response.writeHead(500, getHeader({
                    cors: enableCors,
                    method: method
                }));
                response.end(e.stack);
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