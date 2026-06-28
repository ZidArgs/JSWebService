import {cleanupPathName} from "../utils/helper/UriPath.js";

const PATH_MATCHER_REGEXP = /^\/(?:(?:(?:[^{}/]+|\{[a-zA-Z0-9_]+\})\/)*(?:[^{}/]+|\{[a-zA-Z0-9_]+\}))?\/?$/;
const PATH_PARAM_REGEXP = /\{([a-zA-Z0-9_]+)\}/g;

export default class PathData {

    #pathName;

    #path;

    #params = [];

    #specifity = [];

    #matcher;

    constructor(pathName) {
        if (!PATH_MATCHER_REGEXP.test(pathName)) {
            throw new Error(`"${pathName}" does not match pattern`);
        }
        this.#pathName = pathName;
        this.#init();
    }

    #init() {
        this.#path = cleanupPathName(this.#pathName).split("/");
        const matcherList = [];

        for (const part of this.#path) {
            if (part === "*") {
                matcherList.push(".*");
                this.#specifity.push(4);
            } else if (part.includes("*")) {
                matcherList.push(part.replace(/\*/g, ".*"));
                this.#specifity.push(3);
            } else if (part.includes("?")) {
                matcherList.push(part.replace(/\?/g, "."));
                this.#specifity.push(2);
            } else if (part.match(PATH_PARAM_REGEXP)) {
                const paramName = part.slice(1, -1);
                this.#params.push(paramName);
                matcherList.push(`(?<${paramName}>[^/]+)`);
                this.#specifity.push(1);
            } else {
                matcherList.push(part);
                this.#specifity.push(0);
            }
        }

        this.#matcher = new RegExp(`^(?<$uri>/${matcherList.join("/")})(?:/(?<$rest>.*))?$`);
    }

    get pathName() {
        return this.#pathName;
    }

    get path() {
        return this.#path;
    }

    get params() {
        return [...this.#params];
    }

    get specifity() {
        return [...this.#specifity];
    }

    get matcher() {
        return this.#matcher;
    }

    get length() {
        return this.#path.length;
    }

    static testPath(path) {
        return PATH_MATCHER_REGEXP.test(path);
    }

}
