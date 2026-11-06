
export default class AbstractRequestFilter {

    #skipFilterCallback = () => false;

    constructor() {
        if (new.target === AbstractRequestFilter) {
            throw new Error("can not construct abstract class");
        }
    }

    set skipFilterCallback(value) {
        if (typeof value !== "function") {
            this.#skipFilterCallback = () => false;
        } else {
            this.#skipFilterCallback = value;
        }
    }

    async exec(request, response, params) {
        if (await this.#skipFilter(request, response, params)) {
            return true;
        }

        return this.filter(request, response, params);
    }

    // eslint-disable-next-line no-unused-vars
    async filter(request, response, params) {
        return true;
    }

    async #skipFilter(request, response, params) {
        return this.#skipFilterCallback(request, response, params);
    }

}
