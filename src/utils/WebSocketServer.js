import WebSocket from "ws";
import crypto from "crypto";
import Ping from "./Ping.js";

const PING_OUT = 10000;
const EMPTY_FN = function() {};

function createUUID() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
        (c ^ crypto.randomBytes(1)[0] & 15 >> c / 4).toString(16)
    );
}

export default class WebSocketServer {

    #sockets = new Map();

    #server = new WebSocket.Server({noServer: true});

    #onconnect = EMPTY_FN;

    #onmessage = EMPTY_FN;

    #onclose = EMPTY_FN;

    constructor() {
        this.#server.on("connection", (ws) => {
            ws.isAlive = true;
            ws.id = createUUID();
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
