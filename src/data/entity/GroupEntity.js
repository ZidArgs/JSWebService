import AbstractEntity from "./AbstractEntity.js";

const GROUP_INSTANCES = new Map();

export default class GroupEntity extends AbstractEntity {

    #name = "";

    #active = true;

    #expires = false;

    #permissions = new Set();

    constructor(name) {
        if (GROUP_INSTANCES.has(name)) {
            return GROUP_INSTANCES.get(name);
        }
        super();
        this.#name = name;
        GROUP_INSTANCES.set(name, this);
    }

    get name() {
        return this.#name;
    }

    set active(value) {
        value = !!value;
        if (this.#active !== value) {
            this.#active = value;
            this.notifyChange();
        }
    }

    get active() {
        return this.#active;
    }

    set expires(value) {
        if (value === null || value === undefined || value === false) {
            if (this.#expires !== false) {
                this.#expires = false;
                this.notifyChange();
            }
        } else if (value instanceof Date) {
            if (this.#expires === false || this.#expires.getTime() !== value.getTime()) {
                this.#expires = value;
                this.notifyChange();
            }
        }
    }

    get expires() {
        return this.#expires;
    }

    addPermission(value) {
        if (typeof value === "string") {
            if (!this.#permissions.has(value)) {
                this.#permissions.add(value);
                this.notifyChange();
            }
        }
    }

    removePermission(value) {
        if (typeof value === "string") {
            if (this.#permissions.has(value)) {
                this.#permissions.delete(value);
                this.notifyChange();
            }
        }
    }

    hasPermission(value) {
        return this.#permissions.has(value);
    }

    get permissions() {
        return [...this.#permissions];
    }

    toJSON() {
        return {
            id: this.id,
            created: this.created,
            name: this.name,
            active: this.active,
            expires: this.expires,
            permissions: this.permissions
        };
    }

}
