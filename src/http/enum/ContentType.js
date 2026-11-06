import Enum from "@emcjs/core/enum/Enum.js";

export default class ContentType extends Enum {

    static ALL = new this("*/*");

    static TEXT_PLAIN_JSON = new this("text/plain");

    static TEXT_PLAIN_UTF8 = new this("text/plain; charset=utf-8");

    static TEXT_HTML = new this("text/html");

    static TEXT_HTML_UTF8 = new this("text/html; charset=utf-8");

    static APPLICATION_JSON = new this("application/json");

    static APPLICATION_JSON_UTF8 = new this("application/json; charset=utf-8");

}
