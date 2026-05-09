import fs from "fs";
import crypto from "crypto";
import LoggableMixin from "../../mixins/LoggableMixin.js";

const FILENAME = __dirname + "/data/accounts.js";
const ACCOUNTS = JSON.parse(fs.readFileSync(FILENAME).toString());

function hashPass(password, salt) {
    return crypto.pbkdf2Sync(password, salt,  1000, 64, `sha512`).toString(`hex`);
}

// TODO add permission checks for altering user data
export default class AccountManager extends LoggableMixin() {

    add(userId, email, password) {
        if (ACCOUNTS[userId] != null) {
            const salt = crypto.randomBytes(16).toString("hex");
            ACCOUNTS[userId] = {
                userId: userId,
                email: email,
                password: hashPass(password, salt),
                salt: salt,
                api_token: "",
                totp_secret: "",
                active: false,
                created: new Date(),
                expires: false,
                groups: [],
                permissions: []
            };
            fs.writeFileSync(FILENAME, JSON.stringify(ACCOUNTS, null, 4));
            return true;
        }
        return false;
    }

    getInfo(userId) {
        if (ACCOUNTS[userId] != null) {
            const acc = ACCOUNTS[userId];
            return {
                userId: acc.userId,
                email: acc.email,
                active: acc.active,
                created: acc.created,
                expires: acc.expires,
                groups: [...acc.groups]
            };
        }
        return null;
    }

    has(userId) {
        return ACCOUNTS[userId] != null;
    }

    setPassword(userId, old_password, new_password) {
        if (ACCOUNTS[userId] != null) {
            if (this.checkPassword(userId, old_password)) {
                const salt = crypto.randomBytes(16).toString("hex");
                ACCOUNTS[userId].password = hashPass(new_password, salt);
                ACCOUNTS[userId].salt = salt;
                fs.writeFileSync(FILENAME, JSON.stringify(ACCOUNTS, null, 4));
                return true;
            }
        }
        return false;
    }

    checkPassword(userId, password) {
        if (ACCOUNTS[userId] != null) {
            const acc = ACCOUNTS[userId];
            const hash = hashPass(password, acc.salt);
            return hash === acc.password;
        }
        return false;
    }

    addPermission(userId, permissionKey) {
        if (ACCOUNTS[userId] != null) {
            const permissions = ACCOUNTS[userId].permissions;
            const index = permissions.indexOf(permissionKey);
            if (index < 0) {
                permissions.push(permissionKey);
                fs.writeFileSync(FILENAME, JSON.stringify(ACCOUNTS, null, 4));
            }
            return true;
        }
        return false;
    }

    removePermission(userId, permissionKey) {
        if (ACCOUNTS[userId] != null) {
            const permissions = ACCOUNTS[userId].permissions;
            const index = permissions.indexOf(permissionKey);
            if (index >= 0) {
                permissions.splice(index, 1);
                fs.writeFileSync(FILENAME, JSON.stringify(ACCOUNTS, null, 4));
            }
            return true;
        }
        return false;
    }

    hasPermission(userId, permissionKey) {
        if (ACCOUNTS[userId] != null) {
            const permissions = ACCOUNTS[userId].permissions;
            const index = permissions.indexOf(permissionKey);
            if (index >= 0) {
                return true;
            }
        }
        return false;
    }

}
