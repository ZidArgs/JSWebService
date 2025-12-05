import http from "http";
import {
    isDict,
    isNull,
    isNumberNotNaN, isStringNotEmpty
} from "../utils/helper/CheckType.js";
import SameSiteValueEnum from "./enum/SameSiteValueEnum.js";
import {SESSION_COOKIE_NAME} from "./consts.js";

const DEFAULT_HEADERS = {"Content-Type": "text/plain; charset=utf-8"};

function compileCookie(name, value, options = {}) {
    const res = [`${name}=${encodeURIComponent(value)}`];
    const {
        domain, path, sameSite, maxAge, expires, secure, partitioned, httpOnly
    } = options;
    if (isStringNotEmpty(domain)) {
        res.push(`Domain=${domain}`);
    }
    if (isStringNotEmpty(path)) {
        res.push(`Path=${path}`);
    }
    if (isNumberNotNaN(maxAge)) {
        res.push(`Max-Age=${path}`);
    }
    if (expires instanceof Date) {
        res.push(`Expires=${expires.toUTCString()}`);
    }
    if (!isNull(sameSite) &&  SameSiteValueEnum.includes(sameSite)) {
        res.push(`SameSite=${sameSite}`);
    }
    if (secure) {
        res.push(`Secure`);
    }
    if (partitioned) {
        res.push(`Partitioned`);
    }
    if (httpOnly) {
        res.push(`HttpOnly`);
    }
    return res.join("; ");
}

export default class Response {

    #isSend = false;

    #response;

    #statusCode = 200;

    #headers = {...DEFAULT_HEADERS};

    #body = [];

    constructor(response) {
        if (!(response instanceof http.ServerResponse)) {
            throw new TypeError("response must be a ServerResponse");
        }
        this.#response = response;
    }

    set statusCode(value) {
        this.#statusCode = value;
    }

    get statusCode() {
        return this.#statusCode;
    }

    get writableEnded() {
        return this.#response.writableEnded;
    }

    get writableFinished() {
        return this.#response.writableFinished;
    }

    setStatusCode(value) {
        this.statusCode = value;
        return this;
    }

    writeHead() {
        this.#response.writeHead(this.#statusCode);
    }

    setHeader(name, value) {
        this.#headers[name] = value;
        return this;
    }

    setHeaders(headers) {
        if (!isDict(headers)) {
            throw new TypeError("headers must be a Dict");
        }
        for (const name in headers) {
            const value = headers[name];
            this.#headers[name] = value;
        }
        return this;
    }

    setCookie(name, value, options = {}) {
        let cookieList = this.#response.getHeader("set-cookie") ?? [];
        if (!Array.isArray(cookieList)) {
            cookieList = [cookieList];
        }
        const cookie = compileCookie(name, value, options);
        cookieList.push(cookie);
        this.#headers["Set-Cookie"] = cookieList;
        return this;
    }

    writeSession(session) {
        this.setCookie(SESSION_COOKIE_NAME, session.id, {
            expires: new Date(Date.now() + 86400000),
            path: "/",
            secure: true,
            httpOnly: true
        });
    }

    write(chunk, encoding) {
        this.#body.push([chunk, encoding]);
        return this;
    }

    sendStream(stream) {
        if (this.#isSend) {
            throw new Error("response has already been send");
        }
        this.#isSend = true;
        this.#response.writeHead(this.#statusCode, this.#headers);
        for (const [chunk, encoding] of this.#body) {
            this.#response.write(chunk, encoding);
        }
        stream.pipe(this.#response);
    }

    send() {
        if (this.#isSend) {
            throw new Error("response has already been send");
        }
        this.#isSend = true;
        this.#response.writeHead(this.#statusCode, this.#headers);
        for (const [chunk, encoding] of this.#body) {
            this.#response.write(chunk, encoding);
        }
        this.#response.end();
    }

}

