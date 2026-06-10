/**
 * Read the filename string from the content-disposition header.
 *
 * @param {string} header the content-disposition header string
 * @returns {string} the filename
 */
export function getFileName(header) {
    const items = header.split(";");
    for (const item of items) {
        if (item.includes("filename")) {
            const filename = item.split("=")[1];
            return filename.trim().replace(/^["']|["']$/g, "");
        }
    }
    return null;
}
