import ServiceModule from "../ServiceModule.js";
import AccountManager from "../util/AccountManager.js";

// TODO add email verification account activation (extra storage holding token and userId, user stays inactive until verification)
export default class AccountService extends ServiceModule {

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

    async onrequest(request, params) {
        if (request.method == "POST") {
            switch (params[0]) {
                case "login": {
                    return await this.#login(request.query.username, request.query.pass);
                }
                case "logout": {
                    return this.#logout(request.query.token);
                }
                case "register": {
                    return this.#registerAccount(request.query.username, request.query.email, request.query.pass);
                }
                case "remove": {
                    return this.#removeAccount(request.query.token, request.query.pass);
                }
            }
        } else if (request.method == "GET") {
            switch (params[0]) {
                case "user": {
                    return await this.#getAccountData(request.query.token);
                }
                case "api-token": {
                    return await this.#generateApiToken(request.query.token);
                }
            }
        }
        return {status: 400};
    }

    #registerAccount(username, email, pass) {
        if (!AccountManager.has(username)) {
            AccountManager.add(username, email, pass);
        }
    }

    #removeAccount(/* token, pass */) {
        // TODO
    }

    #getAccountData(/* token */) {
        // TODO
    }

    #login(/* username, pass */) {
        // TODO
    }

    #logout(/* token */) {
        // TODO
    }

    #generateApiToken(/* token */) {
        // TODO
    }

}
