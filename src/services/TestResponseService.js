import ServiceModule from "jswebservice/ServiceModule.js";

export default class TestResponseService extends ServiceModule {

    #wss = null;

    constructor(server) {
        super(server);
        this.#wss = server.getWebSocket();
        this.#wss.onmessage = (sender, msg) => this.#onmessage(sender, msg);
    }

    async onrequest(request, params) {
        this.logger.log(`Recieving request: (${request.method}) ${JSON.stringify(params)} ${JSON.stringify(request.location.searchParams)}`);
        this.logger.log("Sending success");
        return {
            status: 200,
            content: "Success"
        };
    }

    #onmessage(sender, msg) {
        this.#wss.send(sender, msg);
    }

}
