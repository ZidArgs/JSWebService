import Enum from "../../data/Enum.js";

export default class SameSiteValueEnum extends Enum {

    static STRICT = new this("Strict");

    static LAX = new this("Lax");

    static NONE = new this("None");

}
