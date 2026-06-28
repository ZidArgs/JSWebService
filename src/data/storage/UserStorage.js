import EventMultiTargetManager from "@emcjs/core/util/event/EventMultiTargetManager.js";
import {isFunction} from "@emcjs/core/util/helper/CheckType.js";
import {debounce} from "@emcjs/core/util/Debouncer.js";
import SecretCredentials from "../auth/SecretCredentials.js";
import TOTPCredentials from "../auth/TOTPCredentials.js";
import UserEntity from "../entity/UserEntity.js";

export default class UserStorage extends EventTarget {

    #entities = new Map();

    #changeEventManager = new EventMultiTargetManager();

    constructor() {
        super();
        this.#changeEventManager.set("change", () => {
            this.#notifyChange();
        });
    }

    #notifyChange = debounce(() => {
        this.dispatchEvent(new Event("change"));
    });

    add(userEntity) {
        if (!(userEntity instanceof UserEntity)) {
            throw new TypeError("userEntity has to be an instance of UserEntity");
        }
        this.#entities.set(userEntity.id, userEntity);
        this.#changeEventManager.addTarget(userEntity);
    }

    delete(userEntity) {
        if (!(userEntity instanceof UserEntity)) {
            throw new TypeError("userEntity has to be an instance of UserEntity");
        }
        this.#entities.delete(userEntity.id);
        this.#changeEventManager.removeTarget(userEntity);
    }

    get(id) {
        return this.#entities.get(id);
    }

    find(callback) {
        if (!isFunction(callback)) {
            throw new TypeError("callback has to be a function");
        }
        for (const [id, userEntity] of this.#entities) {
            if (callback(id, userEntity)) {
                return userEntity;
            }
        }
    }

    serialize() {
        const result = {};
        for (const [id, userEntity] of this.#entities) {
            result[id] = userEntity.serialize();
        }
        return result;
    }

    deserialize(data) {
        this.#entities.clear();
        this.#changeEventManager.clearTargets();
        for (const id in data) {
            const config = data[id];
            const userEntity = new UserEntity(id);
            userEntity.created = config.created;
            userEntity.active = config.active;
            userEntity.expires = config.expires;
            userEntity.email = config.email;
            userEntity.username = config.username;
            userEntity.givenName = config.givenName;
            userEntity.lastName = config.lastName;
            userEntity.lastLogin = config.lastLogin;

            { // password
                const {
                    hash, salt, iterations
                } = config.password;
                userEntity.password = new SecretCredentials(hash, salt, iterations);
            }

            { // totp
                const {secret} = config.totp;
                userEntity.token = new TOTPCredentials(secret);
            }

            for (const name in config.token) {
                const {
                    hash, salt, iterations
                } = config.token[name];
                userEntity.setToken(name, new SecretCredentials(hash, salt, iterations));
            }

            for (const name of config.groups) {
                userEntity.addGroup(name);
            }
            for (const role of config.roles) {
                userEntity.addRole(role);
            }
            this.#entities.set(id, userEntity);
            this.#changeEventManager.addTarget(userEntity);
        }
    }

}
