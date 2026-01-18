export const PATH_MATCHER_REGEXP = /^\/(?:(?:(?:[^{}/]+|\{[a-zA-Z0-9_]+\})\/)*(?:[^{}/]+|\{[a-zA-Z0-9_]+\}))?$/;

export const PATH_PARAM_REGEXP = /\{([a-zA-Z0-9_]+)\}/g;

export  function cleanupPathName(pathName) {
    return pathName.replace(/(^\/|\/$)/g, "").replace(/\\/g, "\\\\").replace(/\./g, "\\.");
}

export function getPathData(pathName) {
    if (!PATH_MATCHER_REGEXP.test(pathName)) {
        throw new Error(`"${pathName}" does not match pattern`);
    }

    const path = cleanupPathName(pathName).split("/");

    const result = {
        pathName,
        path,
        params: [],
        specifity: []
    };

    const matcherList = [];

    for (const part of path) {
        if (part === "*") {
            matcherList.push(".*");
            result.specifity.push(3);
        } else if (part.includes("*")) {
            matcherList.push(part.replace(/\*/g, ".*"));
            result.specifity.push(2);
        } else if (part.match(PATH_PARAM_REGEXP)) {
            const paramName = part.slice(1, -1);
            result.params.push(paramName);
            matcherList.push(`(?<${paramName}>[^/]+)`);
            result.specifity.push(1);
        } else {
            matcherList.push(part);
            result.specifity.push(0);
        }
    }

    result.matcher = new RegExp(`^(?<$uri>/${matcherList.join("/")})(?:/(?<$rest>.*))?$`);
    result.length = path.length;

    return result;
}

export function comparePathConfig(a, b) {
    for (let i = 0; i < a.length; ++i) {
        if (a.specifity[i] == null) {
            return 1;
        }
        if (b.specifity[i] == null) {
            return -1;
        }
        if (a.specifity[i] === b.specifity[i]) {
            continue;
        }
        return a.specifity[i] - b.specifity[i];
    }
    return 0;
}
