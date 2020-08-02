const fs = require("fs");
const path = require("path");

const DEFAULT_INDEX_FILES = ["index.html", "index.htm"];
const DEFAULT_SERVE_FOLDER = "./static";
const DEFAULT_MIME_TYPE = "text/plain; charset=utf-8";
const ALLOWED_EXT = /^[a-z0-9.?|]*$/i;
const DEFAULT_MIME_TYPES = {
    // typical website files
    "html?": "text/html; charset=utf-8",
    "css": "text/css; charset=utf-8",
    "m?js": "text/javascript; charset=utf-8",
    // most common image types
    "ico": "image/x-icon",
    "png": "image/png",
    "svg": "image/svg+xml",
    "jpe?g": "image/jpeg",
    "gif": "image/gif",
    "tiff?": "image/tiff",
    "bmp": "image/bmp",
    // configuration files
    "json": "application/json; charset=utf-8",
    "xml": "application/xml; charset=utf-8",
};



class StaticService {

    #serveFolder = path.resolve("./", DEFAULT_SERVE_FOLDER);
    #defaultIndex = DEFAULT_INDEX_FILES;
    #mimeTypes = [];

    constructor(server, options) {
        if (options == null) {
            options = {};
        }
        if (options.serveFolder != null) {
            this.#serveFolder = path.resolve("./", options.serveFolder);
        }
        if (options.defaultIndex != null) {
            if (Array.isArray(options.defaultIndex)) {
                this.#defaultIndex = options.defaultIndex;
            } else if (typeof options.defaultIndex == "string") {
                this.#defaultIndex = options.defaultIndex.split(" ");
            }
        }
        let types = DEFAULT_MIME_TYPES;
        if (options.mimeTypes != null) {
            types = options.mimeTypes;
        }
        for (let key in types) {
            let value = types[key];
            if (ALLOWED_EXT.test(key)) {
                this.#mimeTypes.push({
                    pattern: new RegExp(`^.*\\.(${key.replace(/\./g, "\\.")})$`, "i"),
                    type: value
                });
            }
        }
        server.onrequest = (method, params, query, body) => this.#onrequest(method, params, query, body);
    }

    #getFile = function (filePath) {
        if (fs.existsSync(filePath)) {
            let stat = fs.statSync(filePath);
            if (stat.isFile(filePath)) {
                return filePath;
            }
        }
        
        for (let index of this.#defaultIndex) {
            let current = path.resolve(filePath, index);
            if (fs.existsSync(current)) {
                let stat = fs.statSync(current);
                if (stat.isFile(current)) {
                    return current;
                }
            }
        }

        return null;
    }
    
    #getMimeType(file) {
        for (let entry of this.#mimeTypes) {
            if (entry.pattern.test(file)) {
                return entry.type;
            }
        }
        return DEFAULT_MIME_TYPE;
    }

    #onrequest = async function(method, params, query, body) {
        if (method == "GET") {
            let filePath = path.resolve(this.#serveFolder, params.join("/"));
            let file = this.#getFile(filePath);
            if (file != null && file.startsWith(this.#serveFolder)) {
                let stat = fs.statSync(file);
                let readStream = fs.createReadStream(file);
                let type = this.#getMimeType(file);
                return {
                    status: 200,
                    stream: readStream,
                    options: {
                        type: type,
                        length: stat.size
                    }
                };
            } else {
                return {
                    status: 404
                };
            }
        } else {
            return {
                status: 405
            };
        }
    };

}

module.exports = StaticService;