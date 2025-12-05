import http from "http";
import {Readable} from "stream";
import {
    isArrayOf,
    isDict,
    isNull,
    isNumberNotNaN, isString, isStringNotEmpty
} from "../utils/helper/CheckType.js";
import SameSiteValueEnum from "./enum/SameSiteValueEnum.js";
import {SESSION_COOKIE_NAME} from "./consts.js";

const DEFAULT_HEADERS = [
    ["content-type", "text/plain; charset=utf-8"]
];

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

    #isFinished = false;

    #response;

    #allowsCookies = false;

    #statusCode = 200;

    #headers = new Map(DEFAULT_HEADERS);

    #cookies = new Map();

    #body = [];

    constructor(response, options = {}) {
        if (!(response instanceof http.ServerResponse)) {
            throw new TypeError("response must be a ServerResponse");
        }
        this.#response = response;
        const {allowsCookies = false} = options;
        this.#allowsCookies = allowsCookies;
    }

    isFinished() {
        return this.#isFinished;
    }

    get allowsCookies() {
        return this.#allowsCookies;
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
        if (!isStringNotEmpty(name)) {
            throw new TypeError("header name must be a non empty string");
        }
        if (!isNumberNotNaN(value) && !isString(value) && isArrayOf(value, isString)) {
            throw new TypeError("header value must either a number, a string or an array of strings");
        }
        name = name.toLowerCase();
        if (name !== "set-cookie") {
            if (!this.#response.headersSent) {
                this.#headers.set(name, value);
            } else {
                console.error(`trying to write header after sending response [${name}: ${value}]`);
            }
        }
        return this;
    }

    setHeaders(headers) {
        if (!isDict(headers)) {
            throw new TypeError("headers must be a Dict");
        }
        for (const name in headers) {
            const value = headers[name];
            this.setHeader(name, value);
        }
        return this;
    }

    setCookie(name, value, options = {}) {
        if (this.#allowsCookies && name !== SESSION_COOKIE_NAME) {
            const cookie = compileCookie(name, value, options);
            this.#cookies.set(name, cookie);
        }
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

    send(content, encoding) {
        if (this.#isFinished) {
            throw new Error("response has already ended");
        }
        this.#writeHeaders();
        if (content != null) {
            if (content instanceof Readable) {
                this.#streamBody(false);
                this.#pipeStream(content);
                return;
            }
            this.#body.push([content, encoding]);
        }
        this.#streamBody();
    }

    getCompiledHeaders() {
        const headerList = {};
        for (const [name, value] of this.#headers) {
            headerList[name] = value;
        }
        if (this.#allowsCookies) {
            headerList["set-cookie"] = this.#cookies.values();
        }
        return headerList;
    }

    #writeHeaders() {
        if (!this.#response.headersSent) {
            this.#response.writeHead(this.#statusCode, this.getCompiledHeaders());
        }
    }

    #streamBody(end = true) {
        if (this.#body.length > 0) {
            const charStream = this.#getStreamFromBody();
            this.#pipeStream(charStream);
        } else if (end) {
            this.#isFinished = true;
            this.#response.end();
        }
    }

    #getStreamFromBody() {
        const charStream = Readable.from("");
        if (this.#body.length > 0) {
            for (const [chunk, encoding] of this.#body) {
                charStream.push(chunk, encoding);
            }
            this.#body = [];
        }
        return charStream;
    }

    #pipeStream(stream, end = true) {
        try {
            this.#isFinished |= end;
            stream.pipe(this.#response, {end});
        } catch (err) {
            this.#isFinished = true;
            console.error("An error occurred:", err);
            this.#response.end();
        }
    }

}

