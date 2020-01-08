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
            let servers = SERVERS.get(this);
            let path = PATHS.get(this);
            let server = new WebSocket.Server({noServer: true});
            let wss = new WSServer(server);
            SOCKETS.set(this, wss);
            servers.addWebSocket(path, server);
            return wss;
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