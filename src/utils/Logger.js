let longestTagSize = 30;

function formatDate(date) {
    const Y = date.getFullYear();
    const M = `0${date.getMonth() + 1}`.slice(-2);
    const D = `0${date.getDate()}`.slice(-2);
    const h = `0${date.getHours()}`.slice(-2);
    const m = `0${date.getMinutes()}`.slice(-2);
    const s = `0${date.getSeconds()}`.slice(-2);
    const z = `00${date.getMilliseconds()}`.slice(-3);
    return `${Y}-${M}-${D} ${h}:${m}:${s}.${z}`;
}

export default class Logger {

    #tag;

    constructor(tag) {
        if (typeof tag !== "string" || tag === "") {
            throw new Error("\"tag\" must be a non empty string");
        }
        this.#tag = tag;
        if (longestTagSize < tag.length) {
            longestTagSize = tag.length;
        }
    }

    get tag() {
        return this.#tag;
    }

    log(message, ...params) {
        const timestamp = formatDate(new Date());
        console.log(`[${timestamp}] ${this.#tag.padEnd(longestTagSize)} :: ${message}`, ...params);
    }

    derive(tag) {
        if (typeof tag !== "string" || tag === "") {
            throw new Error("\"tag\" must be a non empty string");
        }
        const logger = new Logger(tag, this);
        logger.#tag = `${this.#tag} : ${logger.#tag}`;
        if (longestTagSize < logger.#tag.length) {
            longestTagSize = logger.#tag.length;
        }
        return logger;
    }

}
