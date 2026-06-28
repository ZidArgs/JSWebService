import {compareSpecifity} from "@emcjs/core/util/comparator/Specifity.js";
import {isStringNotEmpty} from "@emcjs/core/util/helper/CheckType.js";
import PathData from "../../data/PathData.js";
import LoggableMixin from "../../mixins/LoggableMixin.js";
import {trimPathName} from "../helper/UriPath.js";

export default class PermissionManager extends LoggableMixin() {

    #defaultPublic = true;

    #permissions = new Map();

    #orderedPermissions = [];

    setPrivate() {
        this.logger.log(`update default permission: private`);
        this.#defaultPublic = false;
        return this;
    }

    setPublic() {
        this.logger.log(`update default permission: public`);
        this.#defaultPublic = true;
        return this;
    }

    configurePath(pathName) {
        pathName = trimPathName(pathName);
        pathName = `/${pathName}`;
        if (!PathData.testPath(pathName)) {
            throw new Error(`can not register permission: "${pathName}" does not match pattern`);
        }
        const permission = this.#getOrCreatePermission(pathName);

        const configurer = {
            configurePath: (pathName) => this.configurePath(pathName),
            setPrivate: () => {
                permission.public = false;
                this.logger.log(`update permissions for "${permission.pathName}": private`);
                return configurer;
            },
            setPublic: () => {
                permission.public = true;
                this.logger.log(`update permissions for "${permission.pathName}": public`);
                return configurer;
            },
            addRole: (role) => {
                if (isStringNotEmpty(role) && !permission.roles.has(role)) {
                    permission.roles.add(role);
                    this.logger.log(`update permissions for "${permission.pathName}": add role [${role}]`);
                }
                return configurer;
            }
        };

        return configurer;
    }

    get(pathName) {
        if (this.#permissions.size == 0) {
            return {
                public: this.#defaultPublic,
                roles: []
            };
        }
        pathName = trimPathName(pathName);
        pathName = decodeURI(pathName);
        const path = pathName.split("/");
        const uri = `/${pathName}`;
        for (const config of this.#orderedPermissions) {
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
                return {
                    public: config.public ?? this.#defaultPublic,
                    roles: [...config.roles],
                    params
                };
            }
        }
        if (this.#permissions.has("/")) {
            const config = this.#permissions.get("/");
            const params = {
                "@restPath": pathName,
                "@fullPath": uri,
                "@matchPath": "/"
            };
            return {
                public: config.public ?? this.#defaultPublic,
                roles: [...config.roles],
                params
            };
        }
        return {
            public: this.#defaultPublic,
            roles: []
        };
    }

    #getOrCreatePermission(pathName) {
        if (!this.#permissions.has(pathName)) {
            const config = new PathData(pathName);
            this.#permissions.set(pathName, config);
            this.#orderedPermissions.push(config);
            this.#orderedPermissions.sort(compareSpecifity);

            config.roles = new Set();

            const {
                pathName: path, params, specifity
            } = config;
            this.logger.log(`add permission: "${path}" {${params.join(",")}} [${specifity.join(",")}]`);
            this.logger.log("permission order:");
            for (const config of this.#orderedPermissions) {
                const {
                    pathName: path, params, specifity
                } = config;
                this.logger.log(`    "${path}" {${params.join(",")}} [${specifity.join(",")}]`);
            }
            return config;
        } else {
            return this.#permissions.get(pathName);
        }
    }

}
