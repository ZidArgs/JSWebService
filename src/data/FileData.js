import {
    isNull,
    isString
} from "@emcjs/core/util/helper/CheckType.js";

export default class FileData {

    #data;

    #type;

    #filename;

    #name;

    constructor(data, type, filename, name) {
        if (!(data instanceof Buffer)) {
            throw new TypeError("data needs to be an instance of Buffer");
        }
        if (!isString(type)) {
            throw new TypeError("type needs to be a string");
        }
        if (!isNull(filename) && !isString(filename)) {
            throw new TypeError("filename needs to be a string or null");
        }
        if (!isNull(name) && !isString(name)) {
            throw new TypeError("name needs to be a string or null");
        }
        this.#data = data;
        this.#type = type;
        this.#filename = filename;
        this.#name = name;
    }

    get data() {
        return this.#data;
    }

    get type() {
        return this.#type;
    }

    get filename() {
        return this.#filename;
    }

    get name() {
        return this.#name;
    }

    get size() {
        return this.#data.length;
    }

    toString() {
        return `name=${this.name};filename=${this.filename};type=${this.type};size=${this.size};`;
    }

}
