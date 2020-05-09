const HTTP = require("./utils/HTTPServer.js");
const ServiceWrapper = require("./utils/ServiceWrapper.js");

function getPort(value) {
    let port = parseInt(value);
    if (isNaN(port)) {
        return 8001;
    }
    return port;
}

class WebService {

    #port = "";
    #server = null;

    constructor(port, enableCors) {
        this.#port = getPort(port);
        this.#server = new HTTP(this.#port, !!enableCors);
        console.log(`WebService listening on port ${this.#port}`);
    }

    registerService(ServiceModule, endpoint, options) {
        if (!endpoint.startsWith("/")) {
            endpoint = `/${endpoint}`;
        }
        let wrapper = new ServiceWrapper(this.#server, endpoint);
        let res = new ServiceModule(wrapper, options);
        console.log(`installed service: ${this.#port} => ${endpoint}`);
        return res;
    }

}

module.exports = WebService;