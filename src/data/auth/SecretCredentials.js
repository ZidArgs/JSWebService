import {
    isNumberNotNaN, isStringNotEmpty
} from "@emcjs/core/util/helper/CheckType.js";
import AbstractCredentials from "./AbstractCredentials.js";
import {encryptSecret} from "../../utils/EncryptSecret.js";

export default class SecretCredentials extends AbstractCredentials {

    #hash = "";

    #salt = "";

    #iterations = 0;

    constructor(hash, salt, iterations) {
        if (!isStringNotEmpty(hash)) {
            throw new TypeError("hash has to be a non empty string");
        }
        if (!isStringNotEmpty(salt)) {
            throw new TypeError("salt has to be a non empty string");
        }
        if (!isNumberNotNaN(iterations) || iterations < 0) {
            throw new TypeError("iterations has to be a valid positive number");
        }
        super();
        this.#hash = hash;
        this.#salt = salt;
        this.#iterations = iterations;
    }

    get hash() {
        return this.#hash;
    }

    get salt() {
        return this.#salt;
    }

    get iterations() {
        return this.#iterations;
    }

    verify(secret) {
        if (!isStringNotEmpty(secret)) {
            throw new TypeError("secret has to be a non empty string");
        }
        const hash = encryptSecret(secret, this.salt, this.iterations);
        return hash === this.#hash;
    }

    toJSON() {
        return {
            hash: this.hash,
            salt: this.salt,
            iterations: this.iterations
        };
    }

}
