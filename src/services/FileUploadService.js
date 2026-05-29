import fs from "fs";
import path from "path";
import ServiceModule from "../ServiceModule.js";
import {
    getMultipartBoundary, parseMultipart
} from "../utils/helper/Multipart.js";

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
            this.#createTargetFolder();
            const body = await request.resolveRawBody();
            const data = Buffer.from(body, "base64");
            const boundary = getMultipartBoundary(request.getHeader("content-type"));
            const fileDataList = parseMultipart(data, boundary);
            for (const fileData of fileDataList) {
                this.logger.log("file upload ->", fileData.toString());
                const filePath = path.resolve(this.#targetFolder, fileData.filename);
                fs.writeFileSync(filePath, fileData.data);
            }
            return {status: 200};
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
