import WebSocket from "./WebSocketServer.js";

export default class ServiceWrapper {

    #path = "";

    #server = null;

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

    get port() {
        return this.#server.port;
    }

    get logger() {
        return this.#server.logger;
    }

}
