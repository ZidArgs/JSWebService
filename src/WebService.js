import HTTP from "./utils/HTTPServer.js";
import ServiceWrapper from "./utils/ServiceWrapper.js";
import ServiceModule from "./ServiceModule.js";

function getPort(value) {
    const port = parseInt(value);
    if (isNaN(port)) {
        return 8001;
    }
    return port;
}

export default class WebService {

    #server = null;

    constructor(port = 0, enableCors = false, logRequests = false) {
        this.#server = new HTTP(getPort(port), !!enableCors, !!logRequests);
        console.log(`[WebService:${this.port.toString().padEnd(5)}] start listening`);
    }

    registerService(Module, endpoint, options, credentialsManager) {
        if (!(Module.prototype instanceof ServiceModule)) {
            throw new Error("Error registering service: Only children of ServiceModule can be registered");
        }
        endpoint = `/${endpoint.replace(/^\/|\/$/, "")}`;
        const wrapper = new ServiceWrapper(this.#server, endpoint, credentialsManager);
        const res = new Module(wrapper, options);
        console.log(`[WebService:${this.port.toString().padEnd(5)}] registered service: ${res.instanceName} => ${endpoint}`);
        return res;
    }

    get port() {
        return this.#server.port;
    }

}
