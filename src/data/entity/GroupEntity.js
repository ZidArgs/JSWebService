import AbstractEntity from "./AbstractEntity.js";

export default class GroupEntity extends AbstractEntity {

    #active = true;

    #expires = false;

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

    toJSON() {
        return {
            id: this.id,
            created: this.created,
            active: this.active,
            expires: this.expires,
            roles: this.roles
        };
    }

}
