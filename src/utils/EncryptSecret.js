import {
    isNumberNotNaN,
    isStringNotEmpty
} from "@emcjs/core/util/helper/CheckType.js";
import crypto from "crypto";

const PASSWORD_LENGTH = 256;
const SALT_LENGTH = 64;
const ITERATIONS = 10000;
const DIGEST = "sha256";
const BYTE_TO_STRING_ENCODING = "hex";

export function encryptSecret(secret, salt, iterations) {
    if (!isStringNotEmpty(secret)) {
        throw new TypeError("secret has to be a non empty string");
    }
    if (salt != null && !isStringNotEmpty(salt)) {
        throw new TypeError("salt has to be a non empty string or null");
    }
    if (iterations != null && !isNumberNotNaN(iterations)) {
        throw new TypeError("iterations has to be a valid number or null");
    }

    salt ??= crypto
        .randomBytes(SALT_LENGTH)
        .toString(BYTE_TO_STRING_ENCODING);
    iterations ??= ITERATIONS;

    const hash = crypto.pbkdf2Sync(
        secret,
        salt,
        iterations,
        PASSWORD_LENGTH,
        DIGEST
    ).toString(BYTE_TO_STRING_ENCODING);

    return Object.freeze({
        salt,
        hash,
        digest: DIGEST,
        iterations: ITERATIONS,
        toString: () => `[PBKDF2]${this.digest}:${this.iterations}:${this.salt}:${this.hash}`
    });
}
