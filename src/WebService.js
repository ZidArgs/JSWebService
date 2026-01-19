import HTTP from "./utils/HTTPServer.js";
import ServiceWrapper from "./utils/ServiceWrapper.js";
import ServiceModule from "./ServiceModule.js";
import Logger from "./utils/Logger.js";
import {trimPathName} from "./utils/helper/UriPath.js";

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

    get basePath() {
        return this.#server.basePath;
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
        endpoint = trimPathName(endpoint);
        endpoint = `/${endpoint}`;
        const wrapper = new ServiceWrapper(this.#server, endpoint);
        const module = new Module(wrapper, options);
        if (typeof module.onrequest === "function") {
            this.#server.addReceiver(endpoint, module);
        }
        this.#logger.log(`registered service: ${module.instanceName} => "${endpoint}"`);
        return module;
    }

    registerLocalProxy(proxy, endpoint) {
        endpoint = trimPathName(endpoint);
        endpoint = `/${endpoint}`;
        this.#server.registerLocalProxy(endpoint, proxy);
        this.#logger.log(`registered proxy: ${proxy.instanceName} => "${endpoint}"`);
    }

    printServerInfoPanel() {
        const port = this.#server.port.toString();
        const path = this.#server.basePath.toString();

        const urlString = `http://localhost:${port}${path}`;
        const urlLength = urlString.length;
        const spaceString = " ".repeat(urlLength);
        const outerString = "═".repeat(urlLength);
        const innerString = "─".repeat(urlLength);

        console.log(``);
        console.log(`╔═════════${outerString}═════════╗`);
        console.log(`║ ┌╦┐ ╭───${innerString}───╮ ┌╦┐ ║`);
        console.log(`║  │  │   ${spaceString}   │  │  ║`);
        console.log(`╠─═╬═─╡   ${urlString  }   ╞─═╬═─╣`);
        console.log(`║  │  │   ${spaceString}   │  │  ║`);
        console.log(`║ └╩┘ ╰───${innerString}───╯ └╩┘ ║`);
        console.log(`╚═════════${outerString}═════════╝`);
        console.log(``);
    }

}
