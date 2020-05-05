const HTTP = require('./utils/HTTPServer');
const ServiceWrapper = require('./utils/ServiceWrapper');

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

    registerService(ServiceModule, srv) {
        let wrapper = new ServiceWrapper(this.#server, srv);
        let res = new ServiceModule(wrapper);
        console.log(`installed service: ${this.#port} => ${srv}`);
        return res;
    }

}

module.exports = WebService;