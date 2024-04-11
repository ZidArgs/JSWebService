import ServiceModule from "../ServiceModule.js";
import AccountManager from "../util/AccountManager.js";

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
        server.onrequest = (method, params, query, body) => this.#onrequest(method, params, query, body);
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

    async #onrequest(method, params, query/* , body */) {
        const isAdmin = this.#isUserAdmin(query.token);

        if (!isAdmin) {
            return {status: 403};
        }

        switch (method) {
            case "GET": {
                if (query.search) {
                    return this.#getAccountNames(query.search);
                }
                if (query.username) {
                    return await this.#getAccountData(query.username);
                }
                break;
            }
            case "PUT": {
                return this.#registerAccount(query.name, query.email, query.pass);
            }
            case "DELETE": {
                return this.#removeAccount(query.username, query.pass);
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
