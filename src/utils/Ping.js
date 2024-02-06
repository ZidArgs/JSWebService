export default class Ping {

    #maxtime = 30000;

    #pingFn = null;

    #timeout = null;

    constructor(pingFn, maxtime) {
        if (typeof pingFn !== "function") {
            throw new TypeError("pingFn must be a function");
        }
        maxtime = parseInt(maxtime);
        if (!isNaN(maxtime)) {
            this.#maxtime = maxtime;
        }
        this.#pingFn = pingFn;
        this.ping();
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
        this.#pingFn();
        this.#setNextTimeout();
    }

    #setNextTimeout() {
        clearTimeout(this.#timeout);
        if (this.#maxtime > 0) {
            this.#timeout = setTimeout(() => {
                this.ping();
            }, this.#maxtime);
        } else {
            this.#timeout = undefined;
        }
    }

}
