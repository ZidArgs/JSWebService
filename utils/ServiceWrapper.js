const WebSocket = require('./WebSocketServer');

class ServiceWrapper {

    #server = null;
    #path = "";
    #socket = null;

    constructor(server, path) {
        this.#path = path;
        this.#server = server;
    }

    getWebSocket() {
        if (!this.#socket) {
            this.#socket = new WebSocket();
            this.#server.addWebSocket(this.#path, this.#socket);
        }
        return this.#socket;
    }

    set onrequest(value) {
        if (typeof value == "function") {
            this.#server.addReciever(this.#path, value);
        } else {
            this.#server.removeReciever(this.#path);
        }
    }

}

module.exports = ServiceWrapper;