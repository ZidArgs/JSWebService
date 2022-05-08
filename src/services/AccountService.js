const AccountManager = require("../util/AccountManager.js");

export default class AccountService {

    #wss = null;

    #requestCallbacks = new Map();

    // #requestCounter = 0;

    #hostData = new Map();

    #hostNames = new Map();

    constructor(server) {
        this.#wss = server.getWebSocket();
        this.#wss.onmessage = (sender, msg) => this.#onmessage(sender, msg);
        this.#wss.onclose = (sender) => this.#onclose(sender);
        server.onrequest = (method, params, query, body) => this.#onrequest(method, params, query, body);
    }

    #onmessage = function(sender, msg) {
        if (this.#requestCallbacks.has(msg.requestID)) {
            this.#requestCallbacks.get(msg.requestID)(msg.body);
            this.#requestCallbacks.delete(msg.requestID);
        }
    }

    #onclose = function(sender) {
        const name = this.#hostNames.get(sender);
        this.#hostNames.delete(sender);
        this.#hostData.delete(name);
    }

    #onrequest = async function(method, params, query, body) {
        if (method == "POST") {
            switch (params[0]) {
                case "login": {
                    return await this.#login(query.username, query.pass);
                }
                case "logout": {
                    return this.#logout(query.token);
                }
                case "register": {
                    return this.#registerAccount(query.username, query.email, query.pass);
                }
                case "remove": {
                    return this.#removeAccount(query.token, query.pass);
                }
            }
        } else if (method == "GET") {
            switch (params[0]) {
                case "user": {
                    return await this.#getAccountData(query.token);
                }
                case "api-token": {
                    return await this.#generateApiToken(query.token);
                }
            }
        }
        return {status: 400};
    }

    #registerAccount = function(username, email, pass) {
        if (!AccountManager.has(username)) {
            AccountManager.add(username, email, pass);
        }
    }

    #removeAccount = function(token, pass) {
        // TODO
    }

    #getAccountData = function(token) {
        // TODO
    }

    #login = function(username, pass) {
        // TODO
    }

    #logout = function(token) {
        // TODO
    }

    #generateApiToken = function(token) {
        // TODO
    }

}
