import LoggableMixin from "../../mixins/LoggableMixin.js";

let INSTANCE_COUNTER = 0;

export default class AbstractCredentials extends LoggableMixin() {

    #index = 0;

    constructor() {
        if (new.target === AbstractCredentials) {
            throw new Error("can not construct abstract class");
        }
        super();
        this.#index = INSTANCE_COUNTER++;
        this.logger.log(`credentials created (${this.constructor.name})`);
    }

    get index() {
        return this.#index;
    }

    get instanceName() {
        return `Cred#${this.#index.toString().padStart(3, "0")}`;
    }

    verifyCredentials() {
        return false;
    }

}
