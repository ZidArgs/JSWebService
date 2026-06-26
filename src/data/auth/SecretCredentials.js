import {
    isNumberNotNaN, isStringNotEmpty
} from "@emcjs/core/util/helper/CheckType.js";
import AbstractCredentials from "./AbstractCredentials.js";
import {encryptSecret} from "../../utils/EncryptSecret.js";

export default class SecretCredentials extends AbstractCredentials {

    #secretHash = "";

    #salt = "";

    #iterations = 0;

    constructor(secretHash, salt, iterations) {
        if (!isStringNotEmpty(secretHash)) {
            throw new TypeError("secretHash has to be a non empty string");
        }
        if (!isStringNotEmpty(salt)) {
            throw new TypeError("salt has to be a non empty string");
        }
        if (!isNumberNotNaN(iterations) || iterations < 0) {
            throw new TypeError("iterations has to be a valid positive number");
        }
        super();
        this.#secretHash = secretHash;
        this.#salt = salt;
        this.#iterations = iterations;
    }

    get secretHash() {
        return this.#secretHash;
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
        const secretHash = encryptSecret(secret, this.salt, this.iterations);
        return secretHash === this.#secretHash;
    }

    toJSON() {
        return {
            secretHash: this.secretHash,
            salt: this.salt,
            iterations: this.iterations
        };
    }

}
