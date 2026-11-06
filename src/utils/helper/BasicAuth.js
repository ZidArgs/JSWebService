import Base64 from "./Base64.js";

const BASIC_REGEXP = /^ *Basic +([a-z0-9+/]+={0,2}) *$/i;

export function parseAuth(string) {
    if (typeof string !== "string") {
        throw new TypeError("Expected a string");
    }

    const encoded = getBasicAuthEncoded(string);
    if (encoded === undefined) {
        return undefined;
    }

    // decode user pass
    const userPass = Base64.decode(encoded);
    const colonIndex = userPass.indexOf(":");
    if (colonIndex === -1) {
        return undefined;
    }

    return {
        name: userPass.slice(0, colonIndex),
        pass: userPass.slice(colonIndex + 1)
    };
}

function getBasicAuthEncoded(value) {
    const match = BASIC_REGEXP.exec(value);
    if (!match) {
        return undefined;
    }
    const encoded = match[1];
    const length = encoded.length;
    if (length % 4 === 1 || (encoded.charCodeAt(length - 1) === 61 && length % 4 !== 0)) {
        return undefined;
    }

    return encoded;
}
