import http from "http";
import ReadonlyURL from "./ReadonlyURL.js";
import {resolveRequestBody} from "../utils/helper/Request.js";
import SessionManager from "../utils/manager/SessionManager.js";
import {
    ALLOW_COOKIES_NAME, SESSION_COOKIE_NAME
} from "./consts.js";

function decompileCookie(cookie) {
    const [name, value] = cookie.split("=");
    return {
        name,
        value: decodeURIComponent(value)
    };
}

const PRIVATE_CONSTRUCTOR_KEY = Symbol();

export default class Request {

    #request;

    #session;

    #isNewSession = false;

    #allowsCookies;

    #method;

    #location;

    #originalPath;

    #internalPath;

    #headers = new Map();

    #cookies = new Map();

    #body;

    constructor(request) {
        if (request != PRIVATE_CONSTRUCTOR_KEY) {
            if (!(request instanceof http.IncomingMessage)) {
                throw new TypeError("request must be a IncomingMessage");
            }
            this.#request = request;
            this.#method = request.method.toUpperCase();
            this.#prepareHeaders();
            this.#prepareCookies();
            this.#location = new ReadonlyURL(request.url, this.#origin);
            this.#originalPath = `/${this.#location.pathname.replace(/(^\/|\/$)/g, "")}`;
            this.#internalPath = this.#originalPath;
        }
    }

    get #origin() {
        return this.getHeader("origin") ?? `http://${this.getHeader("host") ?? process.env.HOST ?? "localhost"}`;
    }

    #prepareHeaders() {
        const headerList = this.#request.headers;
        for (const name in headerList) {
            const value = headerList[name];
            this.#headers.set(name.toLowerCase(), value);
        }
    }

    #prepareCookies() {
        let cookieList = this.#headers.get("cookie") ?? [];
        if (!Array.isArray(cookieList)) {
            cookieList = [cookieList];
        }
        for (const cookie of cookieList) {
            const {
                name, value
            } = decompileCookie(cookie);
            this.#cookies.set(name, value);
        }
    }

    get session() {
        if (this.#session == null) {
            const sessionId = this.getCookie(SESSION_COOKIE_NAME);
            if (sessionId != null) {
                this.#session = SessionManager.get(sessionId);
            }
            if (this.#session == null) {
                this.#isNewSession = true;
                this.#session = SessionManager.createSession();
            }
        }
        return this.#session;
    }

    get isNewSession() {
        return this.#isNewSession;
    }

    get allowsCookies() {
        if (this.#allowsCookies == null) {
            const allows = this.getCookie(ALLOW_COOKIES_NAME);
            this.#allowsCookies = allows === true || allows === "true" || allows === 1;
        }
        return this.#allowsCookies;
    }

    get method() {
        return this.#method;
    }

    get location() {
        return this.#location;
    }

    get query() {
        return this.#location.searchParams;
    }

    get originalPath() {
        return this.#originalPath;
    }

    get internalPath() {
        return this.#internalPath;
    }

    get url() {
        return this.#request.url;
    }

    async resolveBody() {
        if (this.#body == null) {
            this.#body = await resolveRequestBody(this.#request);
        }
        return this.#body;
    }

    getHeader(name) {
        return this.#headers.get(name.toLowerCase());
    }

    getCookie(name) {
        return this.#cookies.get(name);
    }

    getSession() {
        const sessionId = this.getCookie(SESSION_COOKIE_NAME);
        return SessionManager.get(sessionId);
    }

    redirectInternal(internalPath) {
        const newRequest = new Request(PRIVATE_CONSTRUCTOR_KEY);
        newRequest.#request = this.#request;
        newRequest.#session = this.#session;
        newRequest.#isNewSession = this.#isNewSession;
        newRequest.#allowsCookies = this.#allowsCookies;
        newRequest.#method = this.#method;
        newRequest.#location = this.#location;
        newRequest.#originalPath = this.#originalPath;
        newRequest.#internalPath = internalPath;
        newRequest.#headers = new Map(this.#headers);
        newRequest.#cookies = new Map(this.#cookies);
        return newRequest;
    }

}
