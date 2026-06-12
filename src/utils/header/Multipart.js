/**
 * Created based on https://github.com/freesoftwarefactory/parse-multipart
 */

import FileData from "../../data/FileData.js";
import MultipartParsingState from "../../enum/MultipartParsingState.js";
import HTTPHeaderEnum from "../../http/enum/HTTPHeaderEnum.js";
import Request from "../../http/Request.js";

const NEWLINE_CHAR = 0x0a; // \n
const RETURN_CHAR = 0x0d; // \r

/**
 * Parse the body to retrieve the multipart data and split it into it's contained files.
 *
 * @param {Buffer} multipartBodyBuffer the buffer containing the request body
 * @param {string} boundary the boundary string used to split the multipart body
 * @returns
 */
export function parseMultipart(multipartBodyBuffer, boundary) {
    let lastline = "";
    let contentDispositionHeader = "";
    let contentTypeHeader = "";
    let state = MultipartParsingState.INIT;
    let buffer = [];
    const allParts = [];

    let currentPartHeaders = [];

    for (let i = 0; i < multipartBodyBuffer.length; i++) {
        const currByte = multipartBodyBuffer[i];
        const prevByte = i > 0 ? multipartBodyBuffer[i - 1] : null;
        const newLineDetected = currByte === NEWLINE_CHAR && prevByte === RETURN_CHAR;

        if (!isNewLineChar(currByte)) {
            lastline += String.fromCharCode(currByte);
        }
        if (state === MultipartParsingState.INIT && newLineDetected) {
            const boundaryString = "--" + boundary;
            if (lastline === boundaryString) {
                state = MultipartParsingState.READING_HEADERS;
            }
            lastline = "";
        } else if (state === MultipartParsingState.READING_HEADERS && newLineDetected) {
            if (lastline.length) {
                currentPartHeaders.push(lastline);
            } else {
                for (const partHeader of currentPartHeaders) {
                    if (partHeader.toLowerCase().startsWith("content-disposition:")) {
                        contentDispositionHeader = partHeader;
                    } else if (partHeader.toLowerCase().startsWith("content-type:")) {
                        contentTypeHeader = partHeader;
                    }
                }
                state = MultipartParsingState.READING_DATA;
                buffer = [];
            }
            lastline = "";
        } else if (state === MultipartParsingState.READING_DATA) {
            if (lastline.length > boundary.length + 4) {
                lastline = "";
            }
            const boundaryString = "--" + boundary;
            if (lastline === boundaryString) {
                const j = buffer.length - lastline.length;
                const part = buffer.slice(0, j - 1);
                const fileData = createFileData(contentDispositionHeader, contentTypeHeader, Buffer.from(part));
                allParts.push(fileData);
                buffer = [];
                currentPartHeaders = [];
                lastline = "";
                state = MultipartParsingState.READING_PART_SEPARATOR;
                contentDispositionHeader = "";
                contentTypeHeader = "";
            } else {
                buffer.push(currByte);
            }
            if (newLineDetected) {
                lastline = "";
            }
        } else if (state === MultipartParsingState.READING_PART_SEPARATOR && newLineDetected) {
            state = MultipartParsingState.READING_HEADERS;
        }
    }
    return allParts;
}

/**
 * Read the boundary string from the content-type header of a request.
 *
 * @param {Request} request the request to read the boundary string from
 * @returns {string} the boundary string used to split the multipart body
 */
export function getMultipartBoundary(request) {
    if (!(request instanceof Request)) {
        throw new TypeError("request has to be an instance of Request");
    }
    const header = request.getHeader(HTTPHeaderEnum.CONTENT_TYPE);
    const items = header.split(";");
    for (const item of items) {
        if (item.includes("boundary")) {
            const boundary = item.split("=")[1];
            return boundary.trim().replace(/^["']|["']$/g, "");
        }
    }
    return null;
}

function createFileData(contentDispositionHeader, contentTypeHeader, part) {
    const header = contentDispositionHeader.split(";");
    const name = header[1]?.split("=")[1].replace(/"/g, "") ?? "";
    const filename = header[2]?.split("=")[1].replace(/"/g, "") ?? "";
    const contentType = contentTypeHeader.split(":")[1].trim();
    return new FileData(part, contentType, filename, name);
}

function isNewLineChar(ch) {
    return ch === NEWLINE_CHAR || ch === RETURN_CHAR;
}
