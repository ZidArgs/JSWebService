import HTTP from "./utils/HTTPServer.js";
import ServiceWrapper from "./utils/ServiceWrapper.js";

function getPort(value) {
    const port = parseInt(value);
    if (isNaN(port)) {
        return 8001;
    }
    return port;
}

export default class WebService {

    #port = "";

    #server = null;

    constructor(port, enableCors) {
        this.#port = getPort(port);
        this.#server = new HTTP(this.#port, !!enableCors);
        console.log(`WebService listening on port ${this.#port}`);
    }

    registerService(ServiceModule, endpoint, options) {
        endpoint = `/${endpoint.replace(/^\/|\/$/, "")}`;
        const wrapper = new ServiceWrapper(this.#server, endpoint);
        const res = new ServiceModule(wrapper, options);
        console.log(`installed service: ${this.#port} => ${endpoint}`);
        return res;
    }

}
