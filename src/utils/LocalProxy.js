import HTTP from "http";

let INSTANCE_COUNTER = 0;

export default class LocalProxy {

    #index = 0;

    #port = "";

    #hostname = "localhost";

    #logRequests = false;

    constructor(port, hostname = "localhost", logRequests = false) {
        this.#index = INSTANCE_COUNTER++;
        this.#port = port;
        this.#hostname = hostname;
        this.#logRequests = logRequests;
        console.log(`[${this.instanceName}] proxy created -> http://${this.#hostname}:${port}`);
    }

    handleRequest(clientRequest, clientResponse) {
        const options = {
            hostname: this.#hostname,
            port: this.#port,
            path: clientRequest.url,
            method: clientRequest.method,
            headers: clientRequest.headers
        };

        const proxy = HTTP.request(options, (res) => {
            if (this.#logRequests) {
                console.log(`[${this.instanceName}] recieving response from (${clientRequest.method}) http://${this.#hostname}:${this.#port}${clientRequest.url}`);
            }
            clientResponse.writeHead(res.statusCode, res.headers);
            res.pipe(clientResponse, {
                end: true
            });
        });

        if (this.#logRequests) {
            console.log(`[${this.instanceName}] sending request to (${clientRequest.method}) http://${this.#hostname}:${this.#port}${clientRequest.url}`);
        }
        clientRequest.pipe(proxy, {
            end: true
        });
    }

    get instanceName() {
        return `${this.constructor.name}#${this.#index}`;
    }

}
