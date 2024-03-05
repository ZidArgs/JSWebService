let INSTANCE_COUNTER = 0;

export default class ServiceModule {

    #index = 0;

    #server;

    constructor(server) {
        this.#index = INSTANCE_COUNTER++;
        this.#server = server;
        console.log(`[${this.instanceName}] service created`);
    }

    get index() {
        return this.#index;
    }

    get port() {
        return this.#server.port;
    }

    get instanceName() {
        return `${this.constructor.name}#${this.index}`;
    }

}
