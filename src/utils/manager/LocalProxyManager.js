import LoggableMixin from "../../mixins/LoggableMixin.js";
import LocalProxy from "../LocalProxy.js";

export default class LocalProxyManager extends LoggableMixin() {

    #localProxies = new Map();
    
    set(pathName, proxy) {
        if (!(proxy instanceof LocalProxy)) {
            throw new TypeError("proxy has to be an instance of Proxy");
        }
        if (!this.#localProxies.has(pathName)) {
            this.#localProxies.set(pathName, proxy);
        }
    }

    delete(pathName) {
        this.#localProxies.delete(pathName);
    }

    get(pathName) {
        pathName = pathName.replace(/(^\/|\/$)/g, "");
        const path = pathName.split("/").map((p) => decodeURI(p));
        while (path.length) {
            const uri = `/${path.join("/")}`;
            if (this.#localProxies.has(uri)) {
                return this.#localProxies.get(uri);
            }
            path.pop();
        }
        if (this.#localProxies.has("/")) {
            return this.#localProxies.get("/");
        }
        return null;
    }

}
