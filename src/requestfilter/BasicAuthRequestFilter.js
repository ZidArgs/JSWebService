import {parseAuth} from "../utils/helper/BasicAuth.js";
import AbstractRequestFilter from "./AbstractRequestFilter.js";

export default class BasicAuthRequestFilter extends AbstractRequestFilter {

    #challenge = true;

    #users = new Map();

    #authorizer = (username, password) => this.#staticUserAuthorizer(username, password);

    #realm = () => null;

    #unauthorizedResponse = () => null;

    constructor(userList = {}) {
        super();
        for (const name in userList) {
            this.#users.set(name, userList[name]);
        }
    }

    async filter(request, response, params) {
        const authHeader = request.getHeader("authorization");
        const authentication = parseAuth(authHeader ?? "");
        if (!authentication) {
            this.#unauthorized(request, response, params);
            return false;
        }

        request.setData("auth", {
            type: "basic-auth",
            user: authentication.name,
            password: authentication.pass
        });

        if (!await this.#authorizer(authentication.name, authentication.pass)) {
            this.#unauthorized(request, response, params);
            return false;
        }

        return true;
    }

    set authorizer(value) {
        if (typeof value !== "function") {
            this.#authorizer = (username, password) => this.#staticUserAuthorizer(username, password);
        } else {
            this.#authorizer = value;
        }
    }

    set realm(value) {
        if (value == undefined) {
            this.#realm = () => null;
        } else if (typeof value !== "function") {
            this.#realm = () => value;
        } else {
            this.#realm = value;
        }
    }

    set unauthorizedResponse(value) {
        if (value == undefined) {
            this.#unauthorizedResponse = () => null;
        } else if (typeof value !== "function") {
            this.#unauthorizedResponse = () => value;
        } else {
            this.#unauthorizedResponse = value;
        }
    }

    #unauthorized(request, response, params) {
        if (this.#challenge) {
            let challengeString = "Basic";
            const realmName = this.#realm(request);

            if (realmName) {
                challengeString += " realm=\"" + realmName + "\"";
            }

            response.setHeader("WWW-Authenticate", challengeString);
        }

        const responseContent = this.#unauthorizedResponse(request, params);

        response.statusCode = 401;

        if (responseContent == null) {
            response.send();
            return;
        }

        if (typeof responseContent === "string") {
            response.send(responseContent);
            return;
        }

        response.setHeader("Content-Type", "application/json; charset=utf-8")
            .send(JSON.stringify(responseContent));
    }

    #staticUserAuthorizer(username, password) {
        if (this.#users.get(username) === password) {
            return true;
        }
        return false;
    }

}
