import {isStringNotEmpty} from "@emcjs/core/util/helper/CheckType.js";
import AbstractCredentials from "./AbstractCredentials.js";

export default class TOTPCredentials extends AbstractCredentials {

    #secret = "";

    constructor(secret) {
        if (!isStringNotEmpty(secret)) {
            throw new TypeError("secret has to be a non empty string");
        }
        super();
        this.#secret = secret;
    }

    get secret() {
        return this.#secret;
    }

    verify(/* value */) {
        // TODO generate TOTP from this.#secret and compare to value
        return false;
    }

    toJSON() {
        return {secret: this.secret};
    }

}
