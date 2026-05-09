import fs from "fs";
import path from "path";
import ServiceModule from "../ServiceModule.js";
import {jsonReplacer} from "@emcjs/core/util/helper/JSON.js";

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
    "xml": "application/xml; charset=utf-8"
};

export default class StaticService extends ServiceModule {

    #serveFolder = path.resolve("./", DEFAULT_SERVE_FOLDER);

    #defaultIndex = DEFAULT_INDEX_FILES;

    #mimeTypes = [];

    #rewrites = [];

    constructor(server, options) {
        super(server);
        if (options == null) {
            options = {};
        }
        if (options.serveFolder != null) {
            this.#serveFolder = path.resolve("./", options.serveFolder);
        }
        this.logger.log(`Serving folder: "${this.#serveFolder}"`);
        if (options.rewrites != null) {
            this.#rewrites = this.#resolveRewrites(options.rewrites);
        }
        this.logger.log(`Registered rewrites: ${JSON.stringify(this.#rewrites, jsonReplacer, 4)}`);
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
        for (const key in types) {
            const value = types[key];
            if (ALLOWED_EXT.test(key)) {
                this.#mimeTypes.push({
                    pattern: new RegExp(`^.*\\.(${key.replace(/\./g, "\\.")})$`, "i"),
                    type: value
                });
            }
        }
    }

    async onrequest(request, params) {
        if (request.method == "GET") {
            const reqestPath = params["@restPath"];
            const internalRequestPath = this.#redirectPath(reqestPath);
            const filePath = path.resolve(this.#serveFolder, internalRequestPath);
            const file = this.#getFile(filePath);
            if (file != null && file.startsWith(this.#serveFolder)) {
                const stat = fs.statSync(file);
                const readStream = fs.createReadStream(file);
                const type = this.#getMimeType(file);
                return {
                    status: 200,
                    stream: readStream,
                    options: {
                        type: type,
                        length: stat.size
                    }
                };
            } else {
                this.logger.log(`Requested file not found: "${internalRequestPath}"`);
                return {status: 404};
            }
        } else {
            return {status: 405};
        }
    }

    #redirectPath(reqestPath) {
        for (const {
            matcher, exclude, rewrite, replace
        } of this.#rewrites) {
            if (matcher instanceof RegExp && matcher.test(reqestPath)) {
                if (exclude instanceof RegExp && !exclude.test(reqestPath)) {
                    if (replace) {
                        const newPath = reqestPath.replace(matcher, rewrite);
                        this.logger.log(`Redirecting: "${reqestPath}" to "${newPath}"`);
                        return newPath;
                    } else {
                        this.logger.log(`Redirecting: "${reqestPath}" to "${rewrite}"`);
                        return rewrite;
                    }
                }
            } else if (exclude instanceof RegExp && !exclude.test(reqestPath)) {
                this.logger.log(`Redirecting: "${reqestPath}" to "${rewrite}"`);
                return rewrite;
            }
        }
        return reqestPath;
    }

    #getFile(filePath) {
        if (fs.existsSync(filePath)) {
            const stat = fs.statSync(filePath);
            if (stat.isFile(filePath)) {
                return filePath;
            }
        }

        for (const index of this.#defaultIndex) {
            const current = path.resolve(filePath, index);
            if (fs.existsSync(current)) {
                const stat = fs.statSync(current);
                if (stat.isFile(current)) {
                    return current;
                }
            }
        }

        return null;
    }

    #getMimeType(file) {
        for (const entry of this.#mimeTypes) {
            if (entry.pattern.test(file)) {
                return entry.type;
            }
        }
        return DEFAULT_MIME_TYPE;
    }

    #resolveRewrites(config) {
        if (!Array.isArray(config)) {
            config = [config];
        }
        config = config.filter((rule) => {
            if (typeof rule !== "object" || Array.isArray(rule)) {
                return false;
            }
            if (typeof rule.rewrite !== "string" || rule.rewrite === "") {
                return false;
            }
            if (rule.matcher != null) {
                if (!(rule.matcher instanceof RegExp) && typeof rule.matcher !== "string" && rule.matcher === "") {
                    return false;
                }
            }
            if (rule.exclude != null) {
                if (!(rule.exclude instanceof RegExp) && typeof rule.exclude !== "string" && rule.exclude === "") {
                    return false;
                }
            }
            return true;
        });
        return config.map((rule) => {
            const res = {
                rewrite: rule.rewrite,
                replace: !!rule.replace
            };
            if (rule.matcher != null) {
                if (!(rule.matcher instanceof RegExp)) {
                    res.matcher = new RegExp(rule.matcher);
                } else {
                    res.matcher = rule.matcher;
                }
            }
            if (rule.exclude != null) {
                if (!(rule.exclude instanceof RegExp)) {
                    res.exclude = new RegExp(rule.exclude);
                } else {
                    res.exclude = rule.exclude;
                }
            }
            return res;
        });
    }

}
