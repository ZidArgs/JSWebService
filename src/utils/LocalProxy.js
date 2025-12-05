import HTTP from "http";
import {EventEmitter} from "events";
import Logger from "./Logger.js";

let INSTANCE_COUNTER = 0;

export default class LocalProxy extends EventEmitter {

    #logger = console;

    #index = 0;

    #port = "";

    #hostname = "localhost";

    #logRequests = false;

    constructor(port, hostname = "localhost", logRequests = false) {
        super();
        this.#index = INSTANCE_COUNTER++;
        this.#port = +port;
        this.#hostname = hostname;
        this.#logRequests = logRequests;
        this.#logger = new Logger(`Proxy            : ${this.instanceName}`);
        this.#logger.log(`proxy created (${this.constructor.name}) -> http://${this.#hostname}:${port}`);
    }

    get port() {
        return this.#port;
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
                this.logger.log(`recieving response from (${clientRequest.method}) http://${this.#hostname}:${this.#port}${clientRequest.url}`);
            }
            clientResponse.writeHead(res.statusCode, res.headers);
            res.pipe(clientResponse, {end: true});
        });

        proxy.on("error", (err) => {
            this.logger.error(`error handling request at (${clientRequest.method}) http://${this.#hostname}:${this.#port}${clientRequest.url}`);
            clientResponse.writeHead(500, this.#getHeader(enableCors));
            clientResponse.end(JSON.stringify({
                url: clientRequest.url,
                error: `Error handling Proxy: ${err.code}`
            }));
        });

        if (this.#logRequests) {
            this.logger.log(`sending request to (${clientRequest.method}) http://${this.#hostname}:${this.#port}${clientRequest.url}`);
        }
        clientRequest.pipe(proxy, {end: true});
    }

    get instanceName() {
        return `Proxy#${this.#index.toString().padStart(3, "0")}`;
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
