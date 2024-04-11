import ServiceModule from "webservice/ServiceModule.js";

export default class TestResponseService extends ServiceModule {

    constructor(server) {
        super(server);
        server.onrequest = () => this.#onrequest();
    }

    async #onrequest() {
        console.log(`[${this.instanceName}] Sending success`);
        return {
            status: 200,
            content: "Success"
        };
    }

}
