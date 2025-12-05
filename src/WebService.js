import HTTP from "./utils/HTTPServer.js";
import ServiceWrapper from "./utils/ServiceWrapper.js";
import ServiceModule from "./ServiceModule.js";
import Logger from "./utils/Logger.js";

function getPort(value) {
    const port = parseInt(value);
    if (isNaN(port)) {
        return 8001;
    }
    return Math.min(Math.max(1024, port), 65535);
}

export default class WebService {

    #logger = console;

    #server = null;

    constructor(port = 0, options = {}) {
        if (typeof options !== "object" || Array.isArray(options)) {
            throw new Error("options has to be a dict or null");
        }
        this.#server = new HTTP(getPort(port), options);
        this.#logger = new Logger(`WebService:${this.port.toString().padStart(5, "0")}`);
        this.#server.logger = this.#logger;
        this.#logger.log("start server");
    }

    get port() {
        return this.#server.port;
    }

    addRewriteRule(rule) {
        this.#server.addRewriteRule(rule);
    }

    registerServiceModule(Module, endpoint, options) {
        if (!(Module.prototype instanceof ServiceModule)) {
            throw new Error("Error registering service: Only children of ServiceModule can be registered");
        }
        endpoint = `/${endpoint.replace(/^\/|\/$/, "")}`;
        const wrapper = new ServiceWrapper(this.#server, endpoint);
        const module = new Module(wrapper, options);
        if (typeof module.onrequest === "function") {
            this.#server.addReceiver(endpoint, module);
        }
        this.#logger.log(`registered service: ${module.instanceName} => "${endpoint}"`);
        return module;
    }

    registerLocalProxy(proxy, endpoint) {
        endpoint = `/${endpoint.replace(/^\/|\/$/, "")}`;
        this.#server.registerLocalProxy(endpoint, proxy);
        this.#logger.log(`registered proxy: ${proxy.instanceName} => "${endpoint}"`);
    }

}
