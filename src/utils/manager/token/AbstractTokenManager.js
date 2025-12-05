import LoggableMixin from "../../../mixins/LoggableMixin.js";

let INSTANCE_COUNTER = 0;

export default class AbstractTokenManager extends LoggableMixin() {

    #index = 0;

    constructor() {
        if (new.target === AbstractTokenManager) {
            throw new Error("can not construct abstract class");
        }
        super();
        this.#index = INSTANCE_COUNTER++;
        this.logger.log(`token manager created (${this.constructor.name})`);
    }

    get index() {
        return this.#index;
    }

    get instanceName() {
        return `Token#${this.#index.toString().padStart(3, "0")}`;
    }

    generateToken() {}

    addToken() {}

    checkToken() {}

    listToken() {}

}
