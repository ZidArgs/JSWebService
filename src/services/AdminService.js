import ServiceModule from "../ServiceModule.js";
import AccountManager from "../utils/manager/AccountManager.js";

export default class AdminService extends ServiceModule {

    #wss = null;

    #requestCallbacks = new Map();

    // #requestCounter = 0;

    #hostData = new Map();

    #hostNames = new Map();

    constructor(server) {
        super(server);
        this.#wss = server.getWebSocket();
        this.#wss.onmessage = (sender, msg) => this.#onmessage(sender, msg);
        this.#wss.onclose = (sender) => this.#onclose(sender);
    }

    #onmessage(sender, msg) {
        if (this.#requestCallbacks.has(msg.requestID)) {
            this.#requestCallbacks.get(msg.requestID)(msg.body);
            this.#requestCallbacks.delete(msg.requestID);
        }
    }

    #onclose(sender) {
        const name = this.#hostNames.get(sender);
        this.#hostNames.delete(sender);
        this.#hostData.delete(name);
    }

    async onrequest(request/* , params */) {
        const isAdmin = this.#isUserAdmin(request.query.token);

        if (!isAdmin) {
            return {status: 403};
        }

        switch (request.method) {
            case "GET": {
                if (request.query.search) {
                    return this.#getAccountNames(request.query.search);
                }
                if (request.query.username) {
                    return await this.#getAccountData(request.query.username);
                }
                break;
            }
            case "PUT": {
                return this.#registerAccount(request.query.name, request.query.email, request.query.pass);
            }
            case "DELETE": {
                return this.#removeAccount(request.query.username, request.query.pass);
            }
            default: {
                return {status: 400};
            }
        }
    }

    #isUserAdmin(/* token */) {
        // TODO
        return false;
    }

    #registerAccount(username, email, pass) {
        if (!AccountManager.has(username)) {
            AccountManager.add(username, email, pass);
        }
    }

    #removeAccount(/* username, pass */) {
        // TODO
    }

    #getAccountNames(/* search */) {
        // TODO
    }

    #getAccountData(/* username */) {
        // TODO
    }

}
