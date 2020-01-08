const WebSocket = require('ws');
const WSServer = require('./WSServer');

const SERVERS = new WeakMap();
const PATHS = new WeakMap();
const SOCKETS = new WeakMap();

class Service {

    constructor(server, path) {
        PATHS.set(this, path);
        SERVERS.set(this, server);
    }

    getWebSocket() {
        if (!SOCKETS.has(this)) {
            let server = SERVERS.get(this);
            let path = PATHS.get(this);
            let wss = new WebSocket.Server({noServer: true});
            server.addWebSocket(path, wss);
            let svr = new WSServer(wss);
            SOCKETS.set(this, svr);
            return svr;
        } else {
            return SOCKETS.get(this);
        }
    }

    set onrequest(value) {
        let server = SERVERS.get(this);
        let path = PATHS.get(this);
        if (typeof value == "function") {
            server.addReciever(path, value);
        } else {
            server.removeReciever(path);
        }
    }

}

module.exports = Service;