

class Ping {

    #maxtime = 10000;
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

    ping() {
        if (!!this.#timeout) {
            clearTimeout(this.#timeout);
        }
        this.#server.clients.forEach(function (ws) {
            if (ws.isAlive === false) {
                return ws.terminate();
            }
            ws.isAlive = false;
            ws.send(JSON.stringify({
                type: "ping",
                time: new Date
            }));
        });
        this.#timeout = setTimeout(()=>this.ping(), this.#maxtime);
    }

}

module.exports = Ping;