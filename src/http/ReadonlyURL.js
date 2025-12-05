import {URL} from "url";

export default class ReadonlyURL {

    #url;

    #searchParams;

    constructor(input, base) {
        this.#url = new URL(input, base);
    }

    get hash() {
        return this.#url.hash;
    }

    get host() {
        return this.#url.host;
    }

    get hostname() {
        return this.#url.hostname;
    }

    get href() {
        return this.#url.href;
    }

    get origin() {
        return this.#url.origin;
    }

    get password() {
        return this.#url.password;
    }

    get pathname() {
        return this.#url.pathname;
    }

    get port() {
        return this.#url.port;
    }

    get protocol() {
        return this.#url.protocol;
    }

    get search() {
        return this.#url.search;
    }

    get searchParams() {
        if (this.#searchParams == null) {
            this.#searchParams = Object.fromEntries(this.#url.searchParams.entries());
        }
        return this.#searchParams;
    }

    get username() {
        return this.#url.username;
    }

    toString() {
        return this.href;
    }

    toJSON() {
        return this.href;
    }

    static canParse(input, base) {
        return URL.canParse(input, base);
    }

    static parse(input, base) {
        try {
            return new ReadonlyURL(input, base);
        } catch {
            return null;
        }
    }

}
