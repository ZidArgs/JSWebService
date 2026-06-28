import EventMultiTargetManager from "@emcjs/core/util/event/EventMultiTargetManager.js";
import {isFunction} from "@emcjs/core/util/helper/CheckType.js";
import {debounce} from "@emcjs/core/util/Debouncer.js";
import GroupEntity from "../entity/GroupEntity.js";

export default class GroupStorage extends EventTarget {

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

    add(groupEntity) {
        if (!(groupEntity instanceof GroupEntity)) {
            throw new TypeError("groupEntity has to be an instance of GroupEntity");
        }
        this.#entities.set(groupEntity.id, groupEntity);
        this.#changeEventManager.addTarget(groupEntity);
    }

    delete(groupEntity) {
        if (!(groupEntity instanceof GroupEntity)) {
            throw new TypeError("groupEntity has to be an instance of GroupEntity");
        }
        this.#entities.delete(groupEntity.id);
        this.#changeEventManager.removeTarget(groupEntity);
    }

    get(name) {
        return this.#entities.get(name);
    }

    find(callback) {
        if (!isFunction(callback)) {
            throw new TypeError("callback has to be a function");
        }
        for (const [name, groupEntity] of this.#entities) {
            if (callback(name, groupEntity)) {
                return groupEntity;
            }
        }
    }

    serialize() {
        const result = {};
        for (const [name, groupEntity] of this.#entities) {
            result[name] = groupEntity.serialize();
        }
        return result;
    }

    deserialize(data) {
        this.#entities.clear();
        this.#changeEventManager.clearTargets();
        for (const name in data) {
            const config = data[name];
            const groupEntity = new GroupEntity(name);
            groupEntity.created = config.created;
            groupEntity.active = config.active;
            groupEntity.expires = config.expires;
            for (const role of config.roles) {
                groupEntity.addRole(role);
            }
            this.#entities.set(name, groupEntity);
            this.#changeEventManager.addTarget(groupEntity);
        }
    }

}
