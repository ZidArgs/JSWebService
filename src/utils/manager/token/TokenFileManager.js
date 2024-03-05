import fs from "fs";
import path from "path";
import {
    createSecureURLToken
} from "../../helper/Crypto.js";
import AbstractTokenManager from "./AbstractTokenManager.js";

const DEFAULT_TOKEN_FILE_PATH = "./token";

export default class FileStorageAPITokenManager extends AbstractTokenManager {

    #strorageFilePath = path.resolve("./", DEFAULT_TOKEN_FILE_PATH);

    #strorageFileFolder = path.dirname(this.#strorageFilePath);

    constructor(storagePath) {
        super();
        if (storagePath != null) {
            this.#strorageFilePath = path.resolve("./", storagePath);
            this.#strorageFileFolder = path.dirname(this.#strorageFilePath);
        }
    }

    generateToken(length, username = "") {
        const tokenData = this.#readTokenList();
        const tokenList = tokenData[username];
        const token = createSecureURLToken(length);
        if (tokenList == null) {
            tokenData[username] = [token];
        } else if (!tokenList.includes(token)) {
            tokenList.push(token);
        }
        this.#writeTokenList(tokenData);
        return token;
    }

    addToken(token, username = "") {
        const tokenData = this.#readTokenList();
        const tokenList = tokenData[username];
        if (tokenList == null) {
            tokenData[username] = [token];
        } else if (!tokenList.includes(token)) {
            tokenList.push(token);
        }
        this.#writeTokenList(tokenData);
    }

    checkToken(token, username = "") {
        const tokenData = this.#readTokenList();
        const tokenList = tokenData?.[username] ?? [];
        return !!tokenList.includes(token);
    }

    listToken(username = "") {
        const tokenData = this.#readTokenList();
        const tokenList = tokenData?.[username] ?? [];
        return tokenList;
    }

    #readTokenList() {
        if (fs.existsSync(this.#strorageFilePath)) {
            const stat = fs.statSync(this.#strorageFilePath);
            if (stat.isFile(this.#strorageFilePath)) {
                return JSON.parse(fs.readFileSync(this.#strorageFilePath).toString());
            }
        }
        return {};
    }

    #writeTokenList(tokenData) {
        if (!fs.existsSync(this.#strorageFileFolder)) {
            fs.mkdirSync(this.#strorageFileFolder);
        }
        fs.writeFileSync(this.#strorageFilePath, JSON.stringify(tokenData));
    }

}
