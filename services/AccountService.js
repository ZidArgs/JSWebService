const AccountManager = require('../util/AccountManager.js');

class AccountService {

    #wss = null;

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
        let name = this.#hostNames.get(sender);
        this.#hostNames.delete(sender);
        this.#hostData.delete(name);
    }

    #onrequest = async function(method, params, query, body) {
        if (method == "POST") {
            switch (params[0]) {
                case "login":
                    return await this.#getAccountData(query.username, query.pass);
                case "logout":
                    return this.#logout(query.token);
                case "register":
                    return this.#registerAccount(query.username, query.email, query.pass);
                case "remove":
                    return this.#removeAccount(query.token, query.pass);
            }
        } else if (method == "GET") {
            switch (params[0]) {
                case "user":
                    return await this.#getAccountInfo(query.token);
                case "api-token":
                    return await this.#generateApiToken(query.token);
            }
        }
        return {
            status: 400
        };
    }

    #registerAccount = function(username, email, pass) {
        if (!AccountManager.has(username)) {
            AccountManager.add(username, email, password);
        }
    }

}

module.exports = AccountService;