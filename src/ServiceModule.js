import LoggableMixin from "./mixins/LoggableMixin.js";

let INSTANCE_COUNTER = 0;

export default class ServiceModule extends LoggableMixin() {

    #index = 0;

    #server;

    constructor(server) {
        super();
        this.#index = INSTANCE_COUNTER++;
        this.#server = server;
        this.logger = server.logger.derive(this.instanceName);
        this.logger.log(`service created (${this.constructor.name})`);
    }

    get index() {
        return this.#index;
    }

    get port() {
        return this.#server.port;
    }

    get instanceName() {
        return `Service#${this.#index.toString().padStart(3, "0")}`;
    }

}
