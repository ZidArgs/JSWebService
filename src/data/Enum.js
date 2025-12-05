export default class Enum {

    #value;

    constructor(value) {
        if (typeof value === "object") {
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

    static includes(value) {
        return this.asArray().includes(value.toString());
    }

    static includesCaseInsensitive(value) {
        return this.asArray().map((e) => e.toLowerCase()).includes(value.toString().toLowerCase());
    }

    static asArray() {
        return Object.keys(this).filter((v) => this[v] instanceof this);
    }

    static toString() {
        return `Enum(${this.asArray().join(", ")})`;
    }

}
