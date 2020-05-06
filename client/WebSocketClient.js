/**
 * NOTE: not usable in FireFox as of now
 */

import MessageBuffer from "./MessageBuffer.js";

const EMPTY_FN = function() {};

export default class WebSocketClient extends EventTarget {

    #messageBuffer = new MessageBuffer();
    #serviceURL;
    #socket;
    #socketID;
    #timeout;
    #maxtime = 30000;
    #onmessage = EMPTY_FN;

    constructor(url) {
        super();
        this.#serviceURL = new URL(url);
        this.#serviceURL.protocol = this.#serviceURL.protocol.replace("http", "ws");
    }

    #setNextTimeout() {
        clearTimeout(this.#timeout);
        if (this.#maxtime > 0) {
            this.#timeout = setTimeout(()=>{
                this.#socket.close();
            }, this.#maxtime);
        } else {
            this.#timeout = undefined;
        }
    }

    #onsocketopen(event) {
        this.#messageBuffer.each(msg => this.send(msg));
        this.#setNextTimeout();
    }

    #onsocketclose(event) {
        clearTimeout(this.#timeout);
        this.#timeout = undefined;
        this.#socket = undefined;
        this.#socketID = undefined;
    }
    
    #onsocketping(msg) {
        this.#setNextTimeout();
        msg.type = "pong";
        this.#socket.send(JSON.stringify(msg));
    }
    
    #onsocketmessage(data) {
        let event = new Event("message");
        event.data = data;
        this.#onmessage(event);
        this.dispatchEvent(event);
    }

    get id() {
        return this.#socketID;
    }

    set maxTime(value) {
        value = parseInt(value);
        if (!isNaN(value) && value >= 0) {
            this.#maxtime = value;
            this.#setNextTimeout();
        }
    }

    get maxTime() {
        return this.#maxtime;
    }

    isOpen() {
        return !!this.#socket && this.#socket.readyState == WebSocket.OPEN;
    }

    open() {
        return new Promise((resolve, reject) => {
            if (!this.#socket) {
                try {
                    this.#socket = new WebSocket(this.#serviceURL);
                    this.#socket.addEventListener('open', (event) => this.#onsocketopen(event));
                    this.#socket.addEventListener('close', (event) => this.#onsocketclose(event));
                    this.#socket.addEventListener('message', (event) => {
                        let msg = JSON.parse(event.data);
                        switch(msg.type) {
                            case "ping":
                                this.#onsocketping(msg);
                            break;
                            case "uuid":
                                this.#socketID = msg.data;
                                resolve();
                            break;
                            case "data":
                                this.#onsocketmessage(msg.data);
                            break;
                        }});
                } catch(e) {
                    reject(e);
                }
            } else {
                resolve();
            }
        });
    }

    close() {
        return new Promise((resolve, reject) => {
            if (!!this.#socket && this.#socket.readyState == WebSocket.OPEN) {
                try {
                    this.#socket.addEventListener('close', (event) => {
                        resolve();
                    });
                    this.#socket.close();
                } catch(e) {
                    reject(e);
                }
            } else {
                resolve();
            }
        });
    }

    send(data) {
        if (typeof data == "undefined") {
            throw new Error("can not send undefined data");
        }
        let msg = JSON.stringify({
            type: "data",
            data: data
        });
        if (!!this.#socket && this.#socket.readyState == WebSocket.OPEN) {
            this.#socket.send(msg);
        } else {
            this.#messageBuffer.add(msg);
        }
    }

    set onmessage(callback) {
        if (typeof callback == "function") {
            this.#onmessage = callback;
        } else {
            this.#onmessage = EMPTY_FN;
        }
    }

    get onmessage() {
        return this.#onmessage;
    }

}