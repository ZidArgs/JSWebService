import {debounce} from "@emcjs/core/util/Debouncer.js";

export default class AbstractEntity extends EventTarget {

    #id = "";

    #created = new Date();

    constructor() {
        if (new.target === AbstractEntity) {
            throw new Error("can not construct abstract class");
        }
        super();
    }

    notifyChange = debounce(() => {
        this.dispatchEvent(new Event("change"));
    });

    set id(value) {
        if (typeof value === "string") {
            if (this.#id !== value) {
                this.#id = value;
                this.notifyChange();
            }
        }
    }

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

    toJSON() {
        return {
            id: this.id,
            created: this.created
        };
    }

}
