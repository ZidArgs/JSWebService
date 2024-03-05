import AbstractCredentials from "./AbstractCredentials.js";
import AbstractTokenManager from "../manager/token/AbstractTokenManager.js";

export default class TokenCredentials extends AbstractCredentials {

    #allowQueryToken = false;

    #tokenManager;

    constructor(allowQueryToken = false) {
        super();
        this.#allowQueryToken = !!allowQueryToken;
    }

    setAccessManager(tokenManager) {
        if (tokenManager != null) {
            if (!(tokenManager instanceof AbstractTokenManager)) {
                throw new TypeError("tokenManager has to be an instance of AbstractTokenManager or null");
            }
            this.#tokenManager = tokenManager;
            console.log(`[${this.instanceName}] set token manager: ${this.#tokenManager.instanceName}`);
        } else {
            this.#tokenManager = null;
            console.log(`[${this.instanceName}] remove token manager`);
        }
    }

    verifyCredentials(request) {
        if (this.#tokenManager != null) {
            const location = URL.parse(request.url, true);
            const query = location.query;
            if (this.#allowQueryToken && query.token != null) {
                if (query.user != null) {
                    return this.#tokenManager.checkToken(query.token, query.user);
                }
                return this.#tokenManager.checkToken(query.token);
            }
            const authheader = request.headers.authorization;
            if (authheader != null) {
                const [user, token] = Buffer.from(authheader.split(" ")[1], "base64").toString().split(":");
                return this.#tokenManager.checkToken(token, user);
            }
        }
        return false;
    }

}
