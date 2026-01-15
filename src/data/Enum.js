class EnumIterator extends Iterator {

    #values;

    constructor(values) {
        super();
        this.#values = Array.from(values);
    }

    static {
        Object.defineProperty(this.prototype, Symbol.toStringTag, {
            value: "Enum Iterator",
            configurable: true,
            enumerable: false,
            writable: false
        });

        delete this.prototype.constructor;
    }

    next() {
        if (this.#values.length) {
            const value = this.#values.shift();
            return {
                value: value,
                done: false
            };
        }
        return {
            value: undefined,
            done: true
        };
    }

}

export default class Enum {

    #value;

    constructor(value) {
        if (typeof value === "object" || typeof value === "function") {
            throw new TypeError("only primitive values allowed");
        }
        this.#value = value;
    }

    get value() {
        return this.#value;
    }

    equals(inst) {
        return this === inst || inst instanceof Enum && this.value === inst.value;
    }

    valueOf() {
        return this.#value;
    }

    toString() {
        return this.#value.toString();
    }

    toJSON() {
        return this.toString();
    }

    static get(value) {
        for (const inst of Object.values(this)) {
            if (inst.value === value) {
                return inst;
            }
        }
    }

    static includes(value, insensitive = false) {
        if (insensitive) {
            return this.values().map((e) => e.toLowerCase()).includes(value.toString().toLowerCase());
        }
        return this.values().includes(value.toString());
    }

    static asArray() {
        return Object.keys(this).filter((v) => this[v] instanceof this);
    }

    static toString() {
        return `Enum(${this.asArray().join(", ")})`;
    }

    static toJSON() {
        return this.toString();
    }

    static [Symbol.iterator]() {
        return new EnumIterator(Object.entries(this).filter(([, v]) => v instanceof this));
    }

}
