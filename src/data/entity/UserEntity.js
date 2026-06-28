import AbstractEntity from "./AbstractEntity.js";
import SecretCredentials from "../auth/SecretCredentials.js";
import GroupEntity from "./GroupEntity.js";
import {isStringNotEmpty} from "@emcjs/core/util/helper/CheckType.js";
import TOTPCredentials from "../auth/TOTPCredentials.js";

export default class UserEntity extends AbstractEntity {

    #email = "";

    #username = "";

    #given_name = "";

    #last_name = "";

    #password = null;

    #token = new Map();

    #totp = null;

    #active = true;

    #expires = false;

    #last_login = new Date();

    #groups = new Set();

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

    set username(value) {
        if (typeof value === "string") {
            if (this.#username !== value) {
                this.#username = value;
                this.notifyChange();
            }
        }
    }

    get username() {
        return this.#username;
    }

    set givenName(value) {
        if (typeof value === "string") {
            if (this.#given_name !== value) {
                this.#given_name = value;
                this.notifyChange();
            }
        }
    }

    get givenName() {
        return this.#given_name;
    }

    set lastName(value) {
        if (typeof value === "string") {
            if (this.#last_name !== value) {
                this.#last_name = value;
                this.notifyChange();
            }
        }
    }

    get lastName() {
        return this.#last_name;
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

    setToken(name, value) {
        if (value instanceof SecretCredentials) {
            const oldToken = this.#token.get(name);
            if (oldToken !== value) {
                this.#token.set(name, value);
                this.notifyChange();
            }
        }
    }

    deleteToken(name) {
        if (this.#token.has(name)) {
            this.#groups.delete(name);
            this.notifyChange();
        }
    }

    get token() {
        return Object.fromEntries(this.#token);
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
            if (value instanceof GroupEntity && !this.#groups.has(value.id)) {
                this.#groups.add(value.id);
                this.notifyChange();
            } else if (isStringNotEmpty(value)) {
                if (!this.#groups.has(value)) {
                    this.#groups.add(value);
                    this.notifyChange();
                }
            }
        }
    }

    removeGroup(...values) {
        for (const value of values) {
            if (value instanceof GroupEntity && this.#groups.has(value.id)) {
                this.#groups.delete(value.id);
                this.notifyChange();
            } else if (isStringNotEmpty(value)) {
                if (this.#groups.has(value)) {
                    this.#groups.delete(value);
                    this.notifyChange();
                }
            }
        }
    }

    get groups() {
        return [...this.#groups];
    }

    hasRole(value) {
        if (super.hasRole(value)) {
            return true;
        }
        for (const group of this.#groups) {
            if (group.hasRole(value)) {
                return true;
            }
        }
        return false;
    }

    toJSON() {
        return {
            id: this.id,
            created: this.created,
            email: this.email,
            username: this.username,
            givenName: this.givenName,
            lastName: this.lastName,
            password: this.password,
            token: this.token,
            totp: this.totp,
            active: this.active,
            expires: this.expires,
            lastLogin: this.lastLogin,
            roles: this.roles,
            groups: this.groups
        };
    }

}
