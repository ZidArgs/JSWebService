export function createOptionsHeader(cors) {
    const res = {};
    res["Content-Type"] = "text/plain; charset=utf-8";
    if (cors) {
        res["Access-Control-Allow-Origin"] = "*";
        res["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS";
        res["Access-Control-Allow-Headers"] = "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range";
        res["Access-Control-Max-Age"] = "1728000";
    }
    res["Content-Length"] = 0;
    return res;
}

export function createHeader(cors, options) {
    const res = {};
    if (options == null) {
        options = {};
    }
    if (options.nocache != null && options.nocache === true) {
        res["Cache-Control"] = "no-cache, no-store, must-revalidate";
        res["Expires"] = "-1";
    }
    if (options.type != null) {
        res["Content-Type"] = options.type;
    } else {
        res["Content-Type"] = "text/plain; charset=utf-8";
    }
    if (options.length != null) {
        res["Content-Length"] = options.length;
    }
    if (options.language != null) {
        res["Content-Language"] = options.language;
    }
    if (cors) {
        res["Access-Control-Allow-Origin"] = "*";
        res["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS";
        res["Access-Control-Allow-Headers"] = "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range";
        res["Access-Control-Expose-Headers"] = "Content-Length,Content-Range";
    }
    return res;
}
