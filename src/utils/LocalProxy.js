import HTTP from "http";
import {
    EventEmitter
} from "events";

let INSTANCE_COUNTER = 0;

export default class LocalProxy extends EventEmitter {

    #index = 0;

    #port = "";

    #hostname = "localhost";

    #logRequests = false;

    constructor(port, hostname = "localhost", logRequests = false) {
        super();
        this.#index = INSTANCE_COUNTER++;
        this.#port = port;
        this.#hostname = hostname;
        this.#logRequests = logRequests;
        console.log(`[${this.instanceName}] proxy created -> http://${this.#hostname}:${port}`);
    }

    handleRequest(clientRequest, clientResponse, enableCors = false) {
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

        proxy.on("error", (err) => {
            console.error(`[${this.instanceName}] error handling request at (${clientRequest.method}) http://${this.#hostname}:${this.#port}${clientRequest.url}`);
            clientResponse.writeHead(500, this.#getHeader(enableCors));
            clientResponse.end(JSON.stringify({
                url: clientRequest.url,
                error: `Error handling Proxy: ${err.code}`
            }));
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

    #getHeader(cors) {
        const res = {};
        res["Content-Type"] = "text/plain; charset=utf-8";
        if (cors) {
            res["Access-Control-Allow-Origin"] = "*";
            res["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS";
            res["Access-Control-Allow-Headers"] = "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range";
            res["Access-Control-Expose-Headers"] = "Content-Length,Content-Range";
        }
        return res;
    }

}
