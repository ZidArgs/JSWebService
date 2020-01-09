const WebSocket = require('ws');
const crypto = require("crypto");
const Ping = require('./Ping');

const PING_OUT = 10000;
const EMPTY_FN = function() {};
    
function createUUID() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.randomBytes(1)[0] & 15 >> c / 4).toString(16)
    )
}

class WebSocketServer {

    #sockets = new Map();
    #server = new WebSocket.Server({noServer: true});

    #onconnect = EMPTY_FN;
    #onmessage = EMPTY_FN;
    #onclose = EMPTY_FN;

    constructor() {
        this.#server.on('connection', (ws) => {
            ws.isAlive = true;
            ws.UUID = createUUID();
            this.#sockets.set(ws.UUID, ws);
            ws.send(JSON.stringify({
                type: 'uuid',
                body: ws.UUID
            }));
            ws.on('message', (message) => {
                let msg = JSON.parse(message);
                if (msg.type == "pong") {
                    ws.isAlive = true;
                } else {
                    this.#onmessage(ws.UUID, msg);
                }
            });
            ws.on('close', () => {
                this.#sockets.delete(ws.UUID);
                this.#onclose(ws.UUID);
            });
            this.#onconnect(ws.UUID);
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
            wss.emit('connection', ws);
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
        data = JSON.stringify(data);
        if (this.#sockets.has(reciever)) {
            this.#sockets.get(reciever).send(data);
        }
    }

    sendMulti(recievers, data) {
        data = JSON.stringify(data);
        for (let reciever of recievers) {
            if (this.#sockets.has(reciever)) {
                this.#sockets.get(reciever).send(data);
            }
        }
    }

    sendAll(data) {
        let recievers = this.#sockets.keys();
        data = JSON.stringify(data);
        for (let reciever of recievers) {
            this.#sockets.get(reciever).send(data);
        }
    }

    sendAllBut(ignored, data) {
        let recievers = this.#sockets.keys();
        data = JSON.stringify(data);
        for (let reciever of recievers) {
            if (reciever == ignored) {
                this.#sockets.get(reciever).send(data);
            }
        }
    }

}

module.exports = WebSocketServer;