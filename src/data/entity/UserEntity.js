import AbstractEntity from "./AbstractEntity.js";
import SecretCredentials from "../auth/SecretCredentials.js";
import GroupEntity from "./GroupEntity.js";
import {isStringNotEmpty} from "@emcjs/core/util/helper/CheckType.js";
import TOTPCredentials from "../auth/TOTPCredentials.js";

export default class UserEntity extends AbstractEntity {

    #email = "";

    #alias = "";

    #password = null;

    #token = null;

    #totp = null;

    #active = true;

    #expires = false;

    #last_login = new Date();

    #groups = new Set();

    #permissions = new Set();

    set email(value) {
        if (typeof value === "string") {
            if (this.#email !== value) {
                this.#email = value;
                this.notifyChange();
            }
        }
    }

    get email() {
        return this.#email;
    }

    set alias(value) {
        if (typeof value === "string") {
            if (this.#alias !== value) {
                this.#alias = value;
                this.notifyChange();
            }
        }
    }

    get alias() {
        return this.#alias;
    }

    set password(value) {
        if (value instanceof SecretCredentials) {
            if (this.#password !== value) {
                this.#password = value;
                this.notifyChange();
            }
        }
    }

    get password() {
        return this.#password;
    }

    set token(value) {
        if (value instanceof SecretCredentials) {
            if (this.#token !== value) {
                this.#token = value;
                this.notifyChange();
            }
        }
    }

    get token() {
        return this.#token;
    }

    set totp(value) {
        if (value instanceof TOTPCredentials) {
            if (this.#totp !== value) {
                this.#totp = value;
                this.notifyChange();
            }
        }
    }

    get totp() {
        return this.#totp;
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

    set lastLogin(value) {
        if (value === null || value === undefined || value === false) {
            if (this.#last_login !== false) {
                this.#last_login = false;
                this.notifyChange();
            }
        } else if (value instanceof Date) {
            if (this.#last_login === false || this.#last_login.getTime() !== value.getTime()) {
                this.#last_login = value;
                this.notifyChange();
            }
        }
    }

    get lastLogin() {
        return this.#last_login;
    }

    addGroup(...values) {
        for (const value of values) {
            if (value instanceof GroupEntity && !this.#groups.has(value)) {
                this.#groups.add(value);
                this.notifyChange();
            } else if (isStringNotEmpty(value)) {
                const groupEntity = new GroupEntity(value);
                if (!this.#groups.has(groupEntity)) {
                    this.#groups.add(groupEntity);
                    this.notifyChange();
                }
            }
        }
    }

    removeGroup(...values) {
        for (const value of values) {
            if (value instanceof GroupEntity && this.#groups.has(value)) {
                this.#groups.delete(value);
                this.notifyChange();
            } else if (isStringNotEmpty(value)) {
                const groupEntity = new GroupEntity(value);
                if (this.#groups.has(groupEntity)) {
                    this.#groups.delete(groupEntity);
                    this.notifyChange();
                }
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
                this.notifyChange();
            }
        }
    }

    removePermission(...values) {
        for (const value of values) {
            if (typeof value === "string" && value !== "" && this.#permissions.has(value)) {
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
            email: this.email,
            alias: this.alias,
            password: this.password,
            token: this.token,
            totp: this.totp,
            active: this.active,
            expires: this.expires,
            last_login: this.last_login,
            groups: this.groups,
            permissions: this.permissions
        };
    }

}
