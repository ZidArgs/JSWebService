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

    constructor(port, enableCors, logRequests) {
        this.#port = getPort(port);
        this.#server = new HTTP(this.#port, !!enableCors, !!logRequests);
        console.log(`[WebService:${this.#port.toString().padEnd(5)}] start listening`);
    }

    registerService(ServiceModule, endpoint, options) {
        endpoint = `/${endpoint.replace(/^\/|\/$/, "")}`;
        const wrapper = new ServiceWrapper(this.#server, endpoint);
        const res = new ServiceModule(wrapper, options);
        console.log(`[WebService:${this.#port.toString().padEnd(5)}] registered {${ServiceModule.name}} => ${endpoint}`);
        return res;
    }

}
