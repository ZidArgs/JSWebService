import WebSocket from "ws";
import crypto from "crypto";
import Ping from "./Ping.js";

const PING_OUT = 10000;
const EMPTY_FN = function() {};
    
function createUUID() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.randomBytes(1)[0] & 15 >> c / 4).toString(16)
    )
}

export default class WebSocketServer {

    #sockets = new Map();
    #server = new WebSocket.Server({noServer: true});

    #onconnect = EMPTY_FN;
    #onmessage = EMPTY_FN;
    #onclose = EMPTY_FN;

    constructor() {
        this.#server.on('connection', (ws) => {
            ws.isAlive = true;
            ws.id = createUUID();
            this.#sockets.set(ws.id, ws);
            ws.send(JSON.stringify({
                type: 'uuid',
                data: ws.id
            }));
            ws.on('message', (message) => {
                const msg = JSON.parse(message);
                switch(msg.type) {
                    case "pong":
                        ws.isAlive = true;
                    break;
                    case "data":
                        this.#onmessage(ws.id, msg.data);
                    break;
                }
            });
            ws.on('close', () => {
                this.#sockets.delete(ws.id);
                this.#onclose(ws.id);
            });
            this.#onconnect(ws.id);
        });
        new Ping(this.#server, PING_OUT);
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
            this.#server.emit('connection', ws);
        });
    }
    
    has(reciever) {
        return this.#sockets.has(reciever);
    }

    close(reciever) {
        if (this.#sockets.has(reciever)) {
            this.#sockets.get(reciever).close();
            this.#sockets.delete(reciever);
        }
    }

    send(reciever, data) {
        const msg = JSON.stringify({
            type: "data",
            data: data
        });
        if (this.#sockets.has(reciever)) {
            this.#sockets.get(reciever).send(msg);
        }
    }

    sendMulti(recievers, data) {
        const msg = JSON.stringify({
            type: "data",
            data: data
        });
        for (let reciever of recievers) {
            if (this.#sockets.has(reciever)) {
                this.#sockets.get(reciever).send(msg);
            }
        }
    }

    sendAll(data) {
        const recievers = this.#sockets.keys();
        const msg = JSON.stringify({
            type: "data",
            data: data
        });
        for (const reciever of recievers) {
            this.#sockets.get(reciever).send(msg);
        }
    }

    sendAllBut(ignored, data) {
        const recievers = this.#sockets.keys();
        const msg = JSON.stringify({
            type: "data",
            data: data
        });
        for (const reciever of recievers) {
            if (reciever == ignored) {
                this.#sockets.get(reciever).send(msg);
            }
        }
    }

}
