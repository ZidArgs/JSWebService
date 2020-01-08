/**
 * This is a service template to briefly show how to implement services
 */

class Service {

    constructor(server) {
        let wss = server.getWebSocket();
        wss.onmessage = function(sender, msg) {
            // return the data recieved by sender
            wss.send(sender, msg);
        };
        server.onRequest = function(headers, method, location, body) {
            // return the data recieved by sender
            return body;
        };
    }

}

module.exports = Service;
