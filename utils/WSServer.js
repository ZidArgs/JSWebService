const crypto = require("crypto");
const Ping = require('./Ping');

const PING_OUT = 10000;
const EMPTY_FN = function() {};
const ON_CONNECT = new WeakMap();
const ON_MESSAGE = new WeakMap();
const ON_CLOSE = new WeakMap();
const SERVERS = new WeakMap();
const SOCKETS = new WeakMap();
    
function createUUID() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.randomBytes(1)[0] & 15 >> c / 4).toString(16)
    )
}

class WSServer {

    constructor(server) {
        ON_CONNECT.set(this, EMPTY_FN);
        ON_MESSAGE.set(this, EMPTY_FN);
        ON_CLOSE.set(this, EMPTY_FN);
        let sockets = new Map();
        server.on('connection', (ws) => {
            ws.isAlive = true;
            ws.UUID = createUUID();
            sockets.set(ws.UUID, ws);
            ws.send(JSON.stringify({
                type: 'uuid',
                body: ws.UUID
            }));
            ws.on('message', (message) => {
                let msg = JSON.parse(message);
                if (msg.type == "pong") {
                    ws.isAlive = true;
                } else {
                    ON_MESSAGE.get(this)(ws.UUID, msg);
                }
            });
            ws.on('close', () => {
                sockets.delete(ws.UUID);
                ON_CLOSE.get(this)(ws.UUID);
            });
            ON_CONNECT.get(this)(ws.UUID);
        });
        SERVERS.set(this, server);
        SOCKETS.set(this, sockets);
        new Ping(server, PING_OUT);
    }

    set onconnect(value) {
        if (typeof value == "function") {
            ON_CONNECT.set(this, value);
        } else {
            ON_CONNECT.set(this, EMPTY_FN);
        }
    }

    set onmessage(value) {
        if (typeof value == "function") {
            ON_MESSAGE.set(this, value);
        } else {
            ON_MESSAGE.set(this, EMPTY_FN);
        }
    }

    set onclose(value) {
        if (typeof value == "function") {
            ON_CLOSE.set(this, value);
        } else {
            ON_CLOSE.set(this, EMPTY_FN);
        }
    }

    close(reciever) {
        let sockets = SOCKETS.get(this);
        if (sockets.has(reciever)) {
            sockets.get(reciever).close();
            sockets.delete(reciever);
        }
    }

    send(reciever, data) {
        let sockets = SOCKETS.get(this);
        let data = JSON.stringify(data);
        if (sockets.has(reciever)) {
            sockets.get(reciever).send(data);
        }
    }

    sendMulti(recievers, data) {
        let sockets = SOCKETS.get(this);
        let data = JSON.stringify(data);
        for (let reciever of recievers) {
            if (sockets.has(reciever)) {
                sockets.get(reciever).send(data);
            }
        }
    }

    sendAll(data) {
        let server = SERVERS.get(this);
        let data = JSON.stringify(data);
        server.clients.forEach(function (ws) {
            ws.send(data);
        });
    }

    sendAllBut(ignored, data) {
        let sockets = SOCKETS.get(this);
        let recievers = sockets.keys();
        let data = JSON.stringify(data);
        for (let reciever of recievers) {
            if (reciever == ignored) {
                sockets.get(reciever).send(data);
            }
        }
    }

}

module.exports = WSServer;