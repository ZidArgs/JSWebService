import WeakInstanceMap from "@emcjs/core/data/collection/WeakInstanceMap.js";
import {debounce} from "@emcjs/core/util/Debouncer.js";
import {isStringNotEmpty} from "@emcjs/core/util/helper/CheckType.js";

const INSTANCES = new WeakInstanceMap();

export default class AbstractEntity extends EventTarget {

    #id = "";

    #created = new Date();

    #roles = new Set();

    constructor(id) {
        if (new.target === AbstractEntity) {
            throw new Error("can not construct abstract class");
        }
        const instance = INSTANCES.get(new.target, id);
        if (instance != null) {
            return instance;
        }
        super();
        INSTANCES.set(new.target, id, this);
        this.#id = id;
    }

    notifyChange = debounce(() => {
        this.dispatchEvent(new Event("change"));
    });

    get id() {
        return this.#id;
    }

    set created(value) {
        if (value === null || value === undefined || value === false) {
            if (this.#created !== false) {
                this.#created = false;
                this.notifyChange();
            }
        } else if (value instanceof Date) {
            if (this.#created === false || this.#created.getTime() !== value.getTime()) {
                this.#created = value;
                this.notifyChange();
            }
        }
    }

    get created() {
        return this.#created;
    }

    addRole(value) {
        if (isStringNotEmpty(value)) {
            if (!this.#roles.has(value)) {
                this.#roles.add(value);
                this.notifyChange();
            }
        }
    }

    removeRole(value) {
        if (isStringNotEmpty(value)) {
            if (this.#roles.has(value)) {
                this.#roles.delete(value);
                this.notifyChange();
            }
        }
    }

    hasRole(value) {
        return this.#roles.has(value);
    }

    get roles() {
        return [...this.#roles];
    }

    toJSON() {
        return {
            id: this.id,
            created: this.created,
            roles: this.roles
        };
    }

    static getEntity(id, type = this) {
        return INSTANCES.get(type, id);
    }

}
