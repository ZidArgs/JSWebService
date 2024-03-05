let INSTANCE_COUNTER = 0;

export default class AbstractTokenManager {

    #index = 0;

    constructor() {
        if (new.target === AbstractTokenManager) {
            throw new Error("can not construct abstract class");
        }
        this.#index = INSTANCE_COUNTER++;
        console.log(`[${this.instanceName}] created`);
    }

    get index() {
        return this.#index;
    }

    get instanceName() {
        return `${this.constructor.name}#${this.index}`;
    }

    generateToken() {}

    addToken() {}

    checkToken() {}

    listToken() {}

}
