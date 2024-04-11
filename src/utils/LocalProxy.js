import HTTP from "http";

let INSTANCE_COUNTER = 0;

export default class LocalProxy {

    #index = 0;

    #port = "";

    constructor(port) {
        this.#index = INSTANCE_COUNTER++;
        this.#port = port;
        console.log(`[${this.instanceName}] proxy created -> http://localhost:${port}`);
    }

    handleRequest(clientRequest, clientResponse) {
        const options = {
            hostname: "localhost",
            port: this.#port,
            path: clientRequest.url,
            method: clientRequest.method,
            headers: clientRequest.headers
        };

        const proxy = HTTP.request(options, (res) => {
            console.log(`[${this.instanceName}] recieving response from (${clientRequest.method}) http://localhost:${this.#port}${clientRequest.url}`);
            clientResponse.writeHead(res.statusCode, res.headers);
            res.pipe(clientResponse, {
                end: true
            });
        });

        console.log(`[${this.instanceName}] sending request to (${clientRequest.method}) http://localhost:${this.#port}${clientRequest.url}`);
        clientRequest.pipe(proxy, {
            end: true
        });
    }

    get instanceName() {
        return `${this.constructor.name}#${this.#index}`;
    }

}
