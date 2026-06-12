import {compareSpecifity} from "@emcjs/core/util/comparator/Specifity.js";
import LoggableMixin from "../../mixins/LoggableMixin.js";
import PathData from "../../data/PathData.js";

export default class WebSocketManager extends LoggableMixin() {

    #sockets = new Map();

    #orderedSockets = [];

    add(pathName, wss) {
        if (!PathData.testPath(pathName)) {
            throw new Error(`can not register websocket: "${pathName}" does not match pattern`);
        }
        if (!this.#sockets.has(pathName)) {
            const config = new PathData(pathName);
            config.wss = wss;
            this.#sockets.set(pathName, config);
            this.#orderedSockets.push(config);
            this.#orderedSockets.sort(compareSpecifity);

            const {
                pathName: path, params, specifity
            } = config;
            this.logger.log(`add websocket: "${path}" {${params.join(",")}} [${specifity.join(",")}]`);
            this.logger.log("websocket order:");
            for (const config of this.#orderedSockets) {
                const {
                    pathName: path, params, specifity
                } = config;
                this.logger.log(`    "${path}" {${params.join(",")}} [${specifity.join(",")}]`);
            }
        } else {
            const config = this.#sockets.get(pathName);
            config.wss = wss;

            const {
                pathName: path, params, specifity
            } = config;
            this.logger.log(`replace websocket: "${path}" {${params.join(",")}} [${specifity.join(",")}]`);
        }
    }

    delete(pathName) {
        this.#sockets.delete(pathName);
        this.#orderedSockets.filter((entry) => entry.pathName !== pathName);
    }

    resolve(pathName) {
        if (this.#sockets.size == 0) {
            this.logger.log("no websocket registered");
            return;
        }
        pathName = pathName.replace(/(^\/|\/$)/g, "");
        const path = pathName.split("/").map((p) => decodeURI(p));
        while (path.length) {
            const uri = `/${path.join("/")}`;
            for (const [, config] of this.#sockets) {
                const match = uri.match(config.matcher);
                if (match != null) {
                    return config.wss;
                }
            }
            path.pop();
        }
        if (this.#sockets.has("/")) {
            const config = this.#sockets.get("/");
            return config.wss;
        }
        this.logger.log("no matching websocket");
    }

}
