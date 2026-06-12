export function trimPathName(pathName) {
    if (typeof pathName !== "string" || pathName === "") {
        return "";
    }
    return pathName.trim().replace(/(^\/|\/$)/g, "");
}

export function cleanupPathName(pathName) {
    return trimPathName(pathName).replace(/\\/g, "\\\\").replace(/\./g, "\\.");
}
