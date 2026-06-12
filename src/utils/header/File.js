import HTTPHeaderEnum from "../../http/enum/HTTPHeaderEnum.js";
import Request from "../../http/Request.js";

/**
 * Read the filename string from the content-disposition header of a request.
 *
 * @param {Request} request the request to read the filename from
 * @returns {string | null} the filename or `null` if not found
 */
export function getRequestFileName(request) {
    if (!(request instanceof Request)) {
        throw new TypeError("request has to be an instance of Request");
    }
    const header = request.getHeader(HTTPHeaderEnum.CONTENT_DISPOSITION);
    const items = header.split(";");
    for (const item of items) {
        if (item.includes("filename")) {
            const filename = item.split("=")[1];
            return filename.trim().replace(/^["']|["']$/g, "");
        }
    }
    return null;
}
