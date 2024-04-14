import ServiceModule from "jswebservice/ServiceModule.js";

export default class TestResponseService extends ServiceModule {

    #wss = null;

    constructor(server) {
        super(server);
        this.#wss = server.getWebSocket();
        this.#wss.onmessage = (sender, msg) => this.#onmessage(sender, msg);
        server.onrequest = (method, params, query) => this.#onrequest(method, params, query);
    }

    async #onrequest(method, params, query) {
        console.log(`[${this.instanceName}] Recieving request: (${method}) ${JSON.stringify(params)} ${JSON.stringify(query)}`);
        console.log(`[${this.instanceName}] Sending success`);
        return {
            status: 200,
            content: "Success"
        };
    }

    #onmessage(sender, msg) {
        this.#wss.send(sender, msg);
    }

}
