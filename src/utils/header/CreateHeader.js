import HTTPHeaderEnum from "../../http/enum/HTTPHeaderEnum.js";

export function createOptionsHeader(cors) {
    const res = {};
    res[HTTPHeaderEnum.CONTENT_TYPE] = "text/plain; charset=utf-8";
    if (cors) {
        res[HTTPHeaderEnum.ACCESS_CONTROL_ALLOW_ORIGIN] = "*";
        res[HTTPHeaderEnum.ACCESS_CONTROL_ALLOW_METHODS] = "GET, POST, PUT, DELETE, OPTIONS";
        res[HTTPHeaderEnum.ACCESS_CONTROL_ALLOW_HEADERS] = "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range";
        res[HTTPHeaderEnum.ACCESS_CONTROL_MAX_AGE] = "1728000";
    }
    res[HTTPHeaderEnum.CONTENT_LENGTH] = 0;
    return res;
}

export function createHeader(cors, options) {
    const res = {};
    if (options == null) {
        options = {};
    }
    if (options.nocache != null && options.nocache === true) {
        res[HTTPHeaderEnum.CACHE_CONTROL] = "no-cache, no-store, must-revalidate";
        res[HTTPHeaderEnum.EXPIRES] = "-1";
    }
    if (options.type != null) {
        res[HTTPHeaderEnum.CONTENT_TYPE] = options.type;
    } else {
        res[HTTPHeaderEnum.CONTENT_TYPE] = "text/plain; charset=utf-8";
    }
    if (options.length != null) {
        res[HTTPHeaderEnum.CONTENT_LENGTH] = options.length;
    }
    if (options.language != null) {
        res[HTTPHeaderEnum.CONTENT_LANGUAGE] = options.language;
    }
    if (cors) {
        res[HTTPHeaderEnum.ACCESS_CONTROL_ALLOW_ORIGIN] = "*";
        res[HTTPHeaderEnum.ACCESS_CONTROL_ALLOW_METHODS] = "GET, POST, PUT, DELETE, OPTIONS";
        res[HTTPHeaderEnum.ACCESS_CONTROL_ALLOW_HEADERS] = "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range";
        res[HTTPHeaderEnum.ACCESS_CONTROL_EXPOSE_HEADERS] = "Content-Length,Content-Range";
    }
    return res;
}
