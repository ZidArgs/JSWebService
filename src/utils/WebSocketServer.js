import WebSocket from "ws";
import Ping from "./Ping.js";
import {uuid4} from "./helper/UniqueGenerator.js";

const PING_OUT = 10000;
const EMPTY_FN = function() {};

export default class WebSocketServer {

    #sockets = new Map();

    #server = new WebSocket.Server({noServer: true});

    #onconnect = EMPTY_FN;

    #onmessage = EMPTY_FN;

    #onclose = EMPTY_FN;

    constructor() {
        this.#server.on("connection", (ws) => {
            ws.isAlive = true;
            ws.id = uuid4();
            this.#sockets.set(ws.id, ws);
            ws.send(JSON.stringify({
                type: "uuid",
                data: ws.id
            }));
            ws.on("message", (message) => {
                const msg = JSON.parse(message);
                switch (msg.type) {
                    case "pong":
                        ws.isAlive = true;
                        break;
                    case "data":
                        this.#onmessage(ws.id, msg.data);
                        break;
                }
            });
            ws.on("close", () => {
                this.#sockets.delete(ws.id);
                this.#onclose(ws.id);
            });
            this.#onconnect(ws.id);
        });
        // ---
        new Ping(() => {
            this.#server.clients.forEach(function(ws) {
                if (ws.isAlive === false) {
                    return ws.terminate();
                }
                ws.isAlive = false;
                ws.send(JSON.stringify({
                    type: "ping",
                    time: new Date()
                }));
            });
        }, PING_OUT);
    }

    set onconnect(value) {
        if (typeof value == "function") {
            this.#onconnect = value;
        } else {
            this.#onconnect = EMPTY_FN;
        }
    }

    set onmessage(value) {
        if (typeof value == "function") {
            this.#onmessage = value;
        } else {
            this.#onmessage = EMPTY_FN;
        }
    }

    set onclose(value) {
        if (typeof value == "function") {
            this.#onclose = value;
        } else {
            this.#onclose = EMPTY_FN;
        }
    }

    handleUpgrade(request, socket, head) {
        this.#server.handleUpgrade(request, socket, head, (ws) => {
            this.#server.emit("connection", ws);
        });
    }

    has(receiver) {
        return this.#sockets.has(receiver);
    }

    close(receiver) {
        if (this.#sockets.has(receiver)) {
            this.#sockets.get(receiver).close();
            this.#sockets.delete(receiver);
        }
    }

    send(receiver, data) {
        const msg = JSON.stringify({
            type: "data",
            data: data
        });
        if (this.#sockets.has(receiver)) {
            this.#sockets.get(receiver).send(msg);
        }
    }

    sendMulti(receivers, data) {
        const msg = JSON.stringify({
            type: "data",
            data: data
        });
        for (const receiver of receivers) {
            if (this.#sockets.has(receiver)) {
                this.#sockets.get(receiver).send(msg);
            }
        }
    }

    sendAll(data) {
        const receivers = this.#sockets.keys();
        const msg = JSON.stringify({
            type: "data",
            data: data
        });
        for (const receiver of receivers) {
            this.#sockets.get(receiver).send(msg);
        }
    }

    sendAllBut(ignored, data) {
        const receivers = this.#sockets.keys();
        const msg = JSON.stringify({
            type: "data",
            data: data
        });
        for (const receiver of receivers) {
            if (receiver == ignored) {
                this.#sockets.get(receiver).send(msg);
            }
        }
    }

}
