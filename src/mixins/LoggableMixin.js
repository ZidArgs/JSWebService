import {createMixin} from "../utils/Mixin.js";
import Logger from "../utils/Logger.js";

export default createMixin((superclass) => class LoggableMixin extends superclass {

    #logger = console;

    set logger(logger) {
        if (logger instanceof Logger) {
            this.#logger = logger;
        } else {
            this.#logger = console;
        }
    }

    get logger() {
        return this.#logger;
    }

});
