import fs from "fs";
import path from "path";
import ServiceModule from "../ServiceModule.js";
import {
    getMultipartBoundary, parseMultipart
} from "../utils/helper/Multipart.js";
import {getFileName} from "../utils/helper/File.js";

const DEFAULT_TARGET_FOLDER = "./upload";

export default class FileUploadService extends ServiceModule {

    #targetFolder = path.resolve("./", DEFAULT_TARGET_FOLDER);

    constructor(server, options) {
        super(server);
        if (options == null) {
            options = {};
        }
        if (options.targetFolder != null) {
            this.#targetFolder = path.resolve("./", options.targetFolder);
        }
        this.logger.log(`Target folder: "${this.#targetFolder}"`);
    }

    async onrequest(request/* , params */) {
        if (request.method == "POST") {
            const body = await request.resolveRawBody();
            const boundary = getMultipartBoundary(request.getHeader("content-type"));
            if (boundary != null) {
                const data = Buffer.from(body, "base64");
                const fileDataList = parseMultipart(data, boundary);
                if (fileDataList.length) {
                    this.#createTargetFolder();
                }
                for (const fileData of fileDataList) {
                    this.logger.log("file upload [multipart] ->", fileData.toString());
                    const filePath = path.resolve(this.#targetFolder, fileData.filename);
                    fs.writeFileSync(filePath, fileData.data);
                }
                return {status: 200};
            } else {
                const filename = getFileName(request.getHeader("content-disposition"));
                if (filename != null) {
                    this.#createTargetFolder();
                    this.logger.log("file upload [raw] ->", filename);
                    const filePath = path.resolve(this.#targetFolder, filename);
                    fs.writeFileSync(filePath, body);
                    return {status: 200};
                }
            }
            return {status: 500};
        } else {
            return {status: 405};
        }
    }

    #createTargetFolder() {
        if (!fs.existsSync(this.#targetFolder)) {
            fs.mkdirSync(this.#targetFolder);
        }
    }

}
