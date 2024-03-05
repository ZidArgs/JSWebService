import HTTP from "./utils/HTTPServer.js";
import ServiceWrapper from "./utils/ServiceWrapper.js";
import ServiceModule from "./ServiceModule.js";

function getPort(value) {
    const port = parseInt(value);
    if (isNaN(port)) {
        return 8001;
    }
    return Math.min(Math.max(1024, port), 65535);
}

export default class WebService {

    #server = null;

    constructor(port = 0, options = {}) {
        if (typeof options !== "object" || Array.isArray(options)) {
            throw new Error("options has to be a dict or null");
        }
        const {accessManager = null, enableCors = false, logRequests = false} = options ?? {};
        this.#server = new HTTP(getPort(port), !!enableCors, !!logRequests);
        console.log(`[WebService:${this.port.toString()}] start server`);
        if (accessManager != null) {
            this.#server.setAccessManager(accessManager);
        }
    }

    setAccessManager(accessManager) {
        this.#server.setAccessManager(accessManager);
    }

    registerService(Module, endpoint, options) {
        if (!(Module.prototype instanceof ServiceModule)) {
            throw new Error("Error registering service: Only children of ServiceModule can be registered");
        }
        endpoint = `/${endpoint.replace(/^\/|\/$/, "")}`;
        const wrapper = new ServiceWrapper(this.#server, endpoint);
        const res = new Module(wrapper, options);
        console.log(`[WebService:${this.port.toString()}] registered service: ${res.instanceName} => "${endpoint}"`);
        return res;
    }

    get port() {
        return this.#server.port;
    }

}
