import {isStringNotEmpty} from "@emcjs/core/util/helper/CheckType.js";

export default class Session {

    #id;

    #isValid = true;

    #data = new Map();

    constructor(id) {
        if (!isStringNotEmpty(id)) {
            throw new TypeError("sessionId must be a non empty string");
        }
        this.#id = id;
    }

    get id() {
        return this.#id;
    }

    get isValid() {
        return this.#isValid;
    }

    invalidate() {
        this.#isValid = false;
    }

    setData(name, value) {
        this.#data.set(name, value);
    }

    getData(name) {
        this.#data.get(name);
    }

    hasData(name) {
        this.#data.has(name);
    }

    getAll() {
        return Object.fromEntries(this.#data.entries());
    }

}
