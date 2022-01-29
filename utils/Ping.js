export default class Ping {

    #maxtime = 30000;

    #server = null;

    #timeout = null;

    constructor(server, maxtime) {
        maxtime = parseInt(maxtime);
        if (!isNaN(maxtime)) {
            this.#maxtime = maxtime;
        }
        this.#server = server;
        this.ping();
    }

    #setNextTimeout = () => {
        clearTimeout(this.#timeout);
        if (this.#maxtime > 0) {
            this.#timeout = setTimeout(() => {
                this.ping();
            }, this.#maxtime);
        } else {
            this.#timeout = undefined;
        }
    }

    set maxTime(value) {
        const time = parseInt(value);
        if (!isNaN(time) && time >= 0) {
            this.#maxtime = time;
            this.#setNextTimeout();
        }
    }

    get maxTime() {
        return this.#maxtime;
    }

    ping() {
        this.#server.clients.forEach(function(ws) {
            if (ws.isAlive === false) {
                return ws.terminate();
            }
            ws.isAlive = false;
            ws.send(JSON.stringify({
                type: "ping",
                time: new Date
            }));
        });
        this.#setNextTimeout();
    }

}
