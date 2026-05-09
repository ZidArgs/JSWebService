import {debounce} from "@emcjs/core/util/Debouncer.js";

export default class UserEntity extends EventTarget {

    #id = "";

    #email = "";

    #password = ""; // TODO make PasswordEntity containing password hash, salt and creation date

    #salt = "";

    #api_token = ""; // TODO make SecretEntity containing value and creation date

    #totp_secret = ""; // TODO make SecretEntity containing value and creation date

    #active = true;

    #expires = false;

    #groups = new Set();

    #permissions = new Set();

    #created = new Date();

    #last_login = new Date();

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

    set email(value) {
        if (typeof value === "string") {
            if (this.#email !== value) {
                this.#email = value;
                this.#notifyChange();
            }
        }
    }

    get email() {
        return this.#email;
    }

    set password(value) {
        if (typeof value === "string") {
            if (this.#password !== value) {
                this.#password = value;
                this.#notifyChange();
            }
        }
    }

    get password() {
        return this.#password;
    }

    set salt(value) {
        if (typeof value === "string") {
            if (this.#salt !== value) {
                this.#salt = value;
                this.#notifyChange();
            }
        }
    }

    get salt() {
        return this.#salt;
    }

    set api_token(value) {
        if (typeof value === "string") {
            if (this.#api_token !== value) {
                this.#api_token = value;
                this.#notifyChange();
            }
        }
    }

    get api_token() {
        return this.#api_token;
    }

    set totp_secret(value) {
        if (typeof value === "string") {
            if (this.#totp_secret !== value) {
                this.#totp_secret = value;
                this.#notifyChange();
            }
        }
    }

    get totp_secret() {
        return this.#totp_secret;
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

    set lastLogin(value) {
        if (value === null || value === undefined || value === false) {
            if (this.#last_login !== false) {
                this.#last_login = false;
                this.#notifyChange();
            }
        } else if (value instanceof Date) {
            if (this.#last_login === false || this.#last_login.getTime() !== value.getTime()) {
                this.#last_login = value;
                this.#notifyChange();
            }
        }
    }

    get lastLogin() {
        return this.#last_login;
    }

    addGroup(...values) {
        for (const value of values) {
            if (typeof value === "string" && value !== "" && !this.#groups.has(value)) {
                this.#groups.add(value);
                this.#notifyChange();
            }
        }
    }

    removeGroup(...values) {
        for (const value of values) {
            if (typeof value === "string" && value !== "" && this.#groups.has(value)) {
                this.#groups.delete(value);
                this.#notifyChange();
            }
        }
    }

    get groups() {
        return [...this.#groups];
    }

    addPermission(...values) {
        for (const value of values) {
            if (typeof value === "string" && value !== "" && !this.#permissions.has(value)) {
                this.#permissions.add(value);
                this.#notifyChange();
            }
        }
    }

    removePermission(...values) {
        for (const value of values) {
            if (typeof value === "string" && value !== "" && this.#permissions.has(value)) {
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
