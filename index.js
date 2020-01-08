const HTTPServer = require('./utils/HTTPServer');
const Service = require('./utils/Service');

function getPort(value) {
    let port = parseInt(value);
    if (isNaN(port)) {
        return 8001;
    }
    return port;
}

const HTTP_SERVER = new WeakMap();
const PORT = new WeakMap();

class WebService {

    constructor(port) {
        port = getPort(port);
        HTTP_SERVER.set(this, new HTTPServer(port));
        console.log(`WebService listening on port ${port}`);
        PORT.set(this, port);
    }

    registerService(Module, srv) {
        new Module(new Service(HTTP_SERVER.get(this), srv));
        console.log(`installed service: ${PORT.get(this)} => ${srv}`);
    }

}

module.exports = WebService;