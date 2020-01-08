const PING_OUT = new WeakMap();
const SERVERS = new WeakMap();
const TIMEOUTS = new WeakMap();

class Ping {

    constructor(server, maxtime = 10000) {
        PING_OUT.set(this, maxtime);
        SERVERS.set(this, server);
        this.ping();
    }

    ping() {
        let maxtime = PING_OUT.get(this);
        let timeout = TIMEOUTS.get(this);
        if (!!timeout) {
            clearTimeout(timeout);
        }
        let server = SERVERS.get(this);
        server.clients.forEach(function (ws) {
            if (ws.isAlive === false) {
                return ws.terminate();
            }
            ws.isAlive = false;
            ws.send(JSON.stringify({
                type: "ping",
                time: new Date
            }));
        });
        timeout = setTimeout(()=>this.ping(), maxtime);
        TIMEOUTS.set(this, timeout);
    }

}

module.exports = Ping;