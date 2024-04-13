import ServiceModule from "webservice/ServiceModule.js";

export default class TestResponseService extends ServiceModule {

    constructor(server) {
        super(server);
        server.onrequest = (method, params, query) => this.#onrequest(method, params, query);
    }

    async #onrequest(method, params, query) {
        console.log(`[${this.instanceName}] Recieving request: (${method}) "${params.join("/")}" ${JSON.stringify(query)}`);
        console.log(`[${this.instanceName}] Sending success`);
        return {
            status: 200,
            content: "Success"
        };
    }

}
