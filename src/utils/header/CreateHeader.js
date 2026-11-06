import HTTPHeader from "@emcjs/core/enum/http/HTTPHeader.js";
import ContentType from "../../http/enum/ContentType.js";

export function createOptionsHeader(cors) {
    const res = {};
    res[HTTPHeader.CONTENT_TYPE] = ContentType.TEXT_PLAIN_UTF8.toString();
    if (cors) {
        res[HTTPHeader.ACCESS_CONTROL_ALLOW_ORIGIN] = "*";
        res[HTTPHeader.ACCESS_CONTROL_ALLOW_METHODS] = "GET, POST, PUT, DELETE, OPTIONS";
        res[HTTPHeader.ACCESS_CONTROL_ALLOW_HEADERS] = "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range";
        res[HTTPHeader.ACCESS_CONTROL_MAX_AGE] = "1728000";
    }
    res[HTTPHeader.CONTENT_LENGTH] = 0;
    return res;
}

export function createHeader(cors, options) {
    const res = {};
    if (options == null) {
        options = {};
    }
    if (options.nocache != null && options.nocache === true) {
        res[HTTPHeader.CACHE_CONTROL] = "no-cache, no-store, must-revalidate";
        res[HTTPHeader.EXPIRES] = "-1";
    }
    if (options.type != null) {
        res[HTTPHeader.CONTENT_TYPE] = options.type.toString();
    } else {
        res[HTTPHeader.CONTENT_TYPE] = ContentType.TEXT_PLAIN_UTF8.toString();
    }
    if (options.length != null) {
        res[HTTPHeader.CONTENT_LENGTH] = options.length;
    }
    if (options.language != null) {
        res[HTTPHeader.CONTENT_LANGUAGE] = options.language;
    }
    if (cors) {
        res[HTTPHeader.ACCESS_CONTROL_ALLOW_ORIGIN] = "*";
        res[HTTPHeader.ACCESS_CONTROL_ALLOW_METHODS] = "GET, POST, PUT, DELETE, OPTIONS";
        res[HTTPHeader.ACCESS_CONTROL_ALLOW_HEADERS] = "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range";
        res[HTTPHeader.ACCESS_CONTROL_EXPOSE_HEADERS] = "Content-Length,Content-Range";
    }
    return res;
}
