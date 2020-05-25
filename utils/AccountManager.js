const fs = require("fs");
const crypto = require("crypto");

const FILENAME = __dirname + "/data/accounts.js";
const ACCOUNTS = JSON.parse(fs.readFileSync(FILENAME).toString());

function hashPass(password, salt) {
    return crypto.pbkdf2Sync(password, salt,  1000, 64, `sha512`).toString(`hex`);
}

class AccountManager {

    add(name, email, password) {
        if (ACCOUNTS[name] != null) {
            let salt = crypto.randomBytes(16).toString('hex');
            ACCOUNTS[name] = {
                email: email,
                password: hashPass(password, salt),
                salt: salt,
                api_token: "",
                plan: null,
                active: false,
                balance: 0
            };
            fs.writeFileSync(FILENAME, JSON.stringify(ACCOUNTS, null, 4));
            return true;
        }
        return false;
    }

    get(name) {
        if (ACCOUNTS[name] != null) {
            let acc = ACCOUNTS[name];
            return {
                email: acc.email,
                plan: acc.plan,
                active: acc.active
            };
        }
        return null;
    }

    has(name) {
        return ACCOUNTS[name] != null;
    }

    changePlan(name, data) {
        if (ACCOUNTS[name] != null) {
            ACCOUNTS[name].plan_next = data;
            fs.writeFileSync(FILENAME, JSON.stringify(ACCOUNTS, null, 4));
            return true;
        }
        return false;
    }

    setPassword(name, old_password, new_password) {
        if (ACCOUNTS[name] != null) {
            if (this.checkPassword(name, old_password)) {
                let salt = crypto.randomBytes(16).toString('hex');
                ACCOUNTS[name].password = hashPass(new_password, salt);
                ACCOUNTS[name].salt = salt;
                return true;
            }
        }
        return false;
    }

    checkPassword(name, password) {
        if (ACCOUNTS[name] != null) {
            let acc = ACCOUNTS[name];
            let hash = hashPass(password, acc.salt);
            return hash == acc.password;
        }
        return false;
    }

}

module.exports = AccountManager;