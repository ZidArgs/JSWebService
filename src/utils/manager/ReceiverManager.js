import LoggableMixin from "../../mixins/LoggableMixin.js";
import {
    comparePathConfig, getPathData, PATH_MATCHER_REGEXP
} from "../helper/UriPath.js";

export default class ReceiverManager extends LoggableMixin() {

    #receivers = new Map();

    #orderedReceivers = [];

    get size() {
        return this.#receivers.size;
    }

    add(pathName, receiver) {
        if (!PATH_MATCHER_REGEXP.test(pathName)) {
            throw new Error(`can not register receiver: "${pathName}" does not match pattern`);
        }
        if (!this.#receivers.has(pathName)) {
            const config = getPathData(pathName);
            config.receiver = receiver;
            this.#receivers.set(pathName, config);
            this.#orderedReceivers.push(config);
            this.#orderedReceivers.sort(comparePathConfig);

            const {
                pathName: path, params, specifity
            } = config;
            this.logger.log(`add receiver: "${path}" {${params.join(",")}} [${specifity.join(",")}]`);
            this.logger.log("receiver order:");
            for (const config of this.#orderedReceivers) {
                const {
                    pathName: path, params, specifity
                } = config;
                this.logger.log(`    "${path}" {${params.join(",")}} [${specifity.join(",")}]`);
            }
        } else {
            const config = this.#receivers.get(pathName);
            config.receiver = receiver;

            const {
                pathName: path, params, specifity
            } = config;
            this.logger.log(`replace receiver: "${path}" {${params.join(",")}} [${specifity.join(",")}]`);
        }
    }

    delete(pathName) {
        this.#receivers.delete(pathName);
        this.#orderedReceivers.filter((entry) => entry.pathName !== pathName);
    }

    async execute(request) {
        if (this.#receivers.size == 0) {
            this.logger.log("no receiver registered");
            return {status: 404};
        }
        const [receiver, params] = this.get(request.internalPath);
        if (receiver != null) {
            return await receiver.onrequest(request, params);
        }
        this.logger.log(`no matching receiver for path "${request.internalPath}"`);
        return {status: 404};
    }

    get(pathName) {
        if (this.#receivers.size == 0) {
            return [];
        }
        pathName = pathName.replace(/(^\/|\/$)/g, "");
        pathName = decodeURI(pathName);
        const path = pathName.split("/");
        const uri = `/${pathName}`;
        for (const config of this.#orderedReceivers) {
            if (path.length < config.length) {
                continue;
            }
            const match = uri.match(config.matcher);
            if (match != null) {
                const params = {
                    "@restPath": match.groups["$rest"] ?? "",
                    "@fullPath": uri,
                    "@matchPath": match.groups["$uri"]
                };
                for (const key of config.params) {
                    if (!key.startsWith("$")) {
                        params[key] = match.groups[key];
                    }
                }
                return [
                    config.receiver,
                    params
                ];
            }
        }
        if (this.#receivers.has("/")) {
            const config = this.#receivers.get("/");
            return [
                config.receiver,
                {
                    "@restPath": pathName,
                    "@fullPath": uri,
                    "@matchPath": "/"
                }
            ];
        }
        return [];
    }

}
