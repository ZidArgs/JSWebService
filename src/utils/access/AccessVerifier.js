import LoggableMixin from "../../mixins/LoggableMixin.js";
import AbstractCredentials from "../credentials/AbstractCredentials.js";

let INSTANCE_COUNTER = 0;

export default class AccessVerifier extends LoggableMixin() {

    #index = 0;

    #servicePublicIndex = new Map();

    #credentialsManagerList = new Set();

    constructor() {
        super();
        this.#index = INSTANCE_COUNTER++;
        this.logger.log(`access verifier created (${this.constructor.name})`);
    }

    get index() {
        return this.#index;
    }

    get instanceName() {
        return `Access#${this.#index.toString().padStart(3, "0")}`;
    }

    checkAccess(request) {
        const location = URL.parse(request.url, true);
        const urlPath = location.pathname;
        const pathName = `/${urlPath.replace(/(^\/|\/$)/g, "")}`;
        if (this.checkPublic(pathName)) {
            return true;
        }
        for (const credentialsManager of this.#credentialsManagerList) {
            if (credentialsManager.verifyCredentials(request)) {
                return true;
            }
        }
        return false;
    }

    setPublic(endpoint, isPublic = false) {
        endpoint = `/${endpoint.replace(/^\/|\/$/, "")}`;
        this.#servicePublicIndex.set(endpoint, isPublic);
        this.logger.log(`set public mode for "${endpoint}" to {${isPublic.toString()}}`);
    }

    checkPublic(pathName) {
        const path = pathName.split("/").map((p) => decodeURI(p));
        while (path.length) {
            const endpoint = `/${path.join("/")}`;
            if (this.#servicePublicIndex.has(endpoint)) {
                return this.#servicePublicIndex.get(endpoint);
            }
            path.pop();
        }
        if (this.#servicePublicIndex.has("/")) {
            return this.#servicePublicIndex.get("/");
        }
        return false;
    }

    addCredentialsManager(credentialsManager) {
        if (credentialsManager != null) {
            if (!(credentialsManager instanceof AbstractCredentials)) {
                throw new TypeError("credentialsManager has to be an instance of CredentialsManager");
            }
            if (!this.#credentialsManagerList.has(credentialsManager)) {
                this.#credentialsManagerList.add(credentialsManager);
                this.logger.log(`add credentials manager: ${credentialsManager.instanceName}`);
            }
        }
    }

    removeCredentialsManager(credentialsManager) {
        if (credentialsManager != null) {
            if (!(credentialsManager instanceof AbstractCredentials)) {
                throw new TypeError("credentialsManager has to be an instance of CredentialsManager");
            }
            if (this.#credentialsManagerList.has(credentialsManager)) {
                this.#credentialsManagerList.delete(credentialsManager);
                this.logger.log(`remove credentials manager: ${credentialsManager.instanceName}`);
            }
        }
    }

}
