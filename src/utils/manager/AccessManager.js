let ACCESS_MANAGER_COUNTER = 0;

export default class AccessManager {

    #index = 0;

    #servicePublicIndex = new Map();

    constructor() {
        this.#index = ACCESS_MANAGER_COUNTER++;
        console.log(`[${this.instanceName}] access manager created`);
    }

    get index() {
        return this.#index;
    }

    get instanceName() {
        return `${this.constructor.name}#${this.index}`;
    }

    checkAccess(path) {
        if (this.checkPublic(path)) {
            return true;
        }
        // const user = userStorage.get(userId)
        // user.hasPermission(permissionId);
        // for (const group of user.groups) group.hasPermission(permissionId);
        return false;
    }

    setPublic(endpoint, isPublic = false) {
        endpoint = `/${endpoint.replace(/^\/|\/$/, "")}`;
        this.#servicePublicIndex.set(endpoint, isPublic);
        console.log(`[${this.instanceName}] set public mode for "${endpoint}" to {${isPublic.toString()}}`);
    }

    checkPublic(path) {
        const parts = path.split("/").map((p) => decodeURI(p));
        while (parts.length) {
            const endpoint = `/${parts.join("/")}`;
            if (this.#servicePublicIndex.has(endpoint)) {
                return this.#servicePublicIndex.get(endpoint);
            }
            parts.pop();
        }
        if (this.#servicePublicIndex.has("/")) {
            return this.#servicePublicIndex.get("/");
        }
        return false;
    }

}
