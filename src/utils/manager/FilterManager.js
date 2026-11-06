import {compareLengthAsc} from "@emcjs/core/util/comparator/Length.js";
import PathData from "../../data/PathData.js";
import LoggableMixin from "../../mixins/LoggableMixin.js";
import {trimPathName} from "../helper/UriPath.js";

export default class FilterManager extends LoggableMixin() {

    #requestFilters = new Map();

    #orderedRequestFilters = [];

    add(pathName, requestFilter) {
        pathName = trimPathName(pathName);
        pathName = `/${pathName}`;
        if (!PathData.testPath(pathName)) {
            throw new Error(`can not register request filter: "${pathName}" does not match pattern`);
        }
        if (!this.#requestFilters.has(pathName)) {
            const config = new PathData(pathName);
            config.requestFilter = requestFilter;
            this.#requestFilters.set(pathName, config);
            this.#orderedRequestFilters.push(config);
            this.#orderedRequestFilters.sort(compareLengthAsc);

            const {
                pathName: path, params, specifity
            } = config;
            this.logger.log(`add request filter: "${path}" {${params.join(",")}} [${specifity.join(",")}]`);
            this.logger.log("request filter order:");
            for (const config of this.#orderedRequestFilters) {
                const {
                    pathName: path, params, specifity
                } = config;
                this.logger.log(`    "${path}" {${params.join(",")}} [${specifity.join(",")}]`);
            }
        } else {
            const config = this.#requestFilters.get(pathName);
            config.requestFilter = requestFilter;

            const {
                pathName: path, params, specifity
            } = config;
            this.logger.log(`replace request filter: "${path}" {${params.join(",")}} [${specifity.join(",")}]`);
        }
    }

    async filter(request, response) {
        if (this.#requestFilters.size == 0) {
            this.logger.log("no request filter registered");
            return true;
        }
        const filterList = this.get(request.internalPath);
        for (const [requestFilter, params] of filterList) {
            if (!await requestFilter.exec(request, response, params)) {
                this.logger.log(`filter [${requestFilter.constructor.name}] on path "${params["@matchPath"]}" failed`);
                return false;
            }
        }
        return true;
    }

    get(pathName) {
        if (this.#requestFilters.size == 0) {
            return [];
        }
        const result = [];
        pathName = trimPathName(pathName);
        pathName = decodeURI(pathName);
        const path = pathName.split("/");
        const uri = `/${pathName}`;

        // get root filter
        if (this.#requestFilters.has("/")) {
            const config = this.#requestFilters.get("/");
            result.push([
                config.requestFilter,
                {
                    "@restPath": pathName,
                    "@fullPath": uri,
                    "@matchPath": "/"
                }
            ]);
        }

        // get path filters
        for (const config of this.#orderedRequestFilters) {
            if (path.length < config.length) {
                continue;
            }
            const match = uri.match(config.matcher);
            if (match != null) {
                const params = {
                    "@restPath": match.groups["$rest"] ?? "",
                    "@fullPath": uri,
                    "@matchPath": match.groups["$uri"]
                };
                for (const key of config.params) {
                    if (!key.startsWith("$")) {
                        params[key] = match.groups[key];
                    }
                }
                result.push([
                    config.requestFilter,
                    params
                ]);
            }
        }

        return result;
    }

}
