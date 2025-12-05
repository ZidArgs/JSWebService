import {debounce} from "../../utils/helper/Debouncer.js";

export default class UserEntity extends EventTarget {

    #id = "";

    #active = true;

    #expires = false;

    #permissions = new Set();

    #created = new Date();

    #notifyChange = debounce(() => {
        this.dispatchEvent(new Event("change"));
    });

    set id(value) {
        if (typeof value === "string") {
            if (this.#id !== value) {
                this.#id = value;
                this.#notifyChange();
            }
        }
    }

    get id() {
        return this.#id;
    }

    set active(value) {
        value = !!value;
        if (this.#active !== value) {
            this.#active = value;
            this.#notifyChange();
        }
    }

    get active() {
        return this.#active;
    }

    set expires(value) {
        if (value === null || value === undefined || value === false) {
            if (this.#expires !== false) {
                this.#expires = false;
                this.#notifyChange();
            }
        } else if (value instanceof Date) {
            if (this.#expires === false || this.#expires.getTime() !== value.getTime()) {
                this.#expires = value;
                this.#notifyChange();
            }
        }
    }

    get expires() {
        return this.#expires;
    }

    set created(value) {
        if (value === null || value === undefined || value === false) {
            if (this.#created !== false) {
                this.#created = false;
                this.#notifyChange();
            }
        } else if (value instanceof Date) {
            if (this.#created === false || this.#created.getTime() !== value.getTime()) {
                this.#created = value;
                this.#notifyChange();
            }
        }
    }

    get created() {
        return this.#created;
    }

    addPermission(value) {
        if (typeof value === "string") {
            if (!this.#permissions.has(value)) {
                this.#permissions.add(value);
                this.#notifyChange();
            }
        }
    }

    removePermission(value) {
        if (typeof value === "string") {
            if (this.#permissions.has(value)) {
                this.#permissions.delete(value);
                this.#notifyChange();
            }
        }
    }

    hasPermission(value) {
        return this.#permissions.has(value);
    }

    get permissions() {
        return [...this.#permissions];
    }

}
