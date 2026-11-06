import CookieManager from "@emcjs/core/data/storage/CookieManager.js";
import Rest from "@emcjs/core/util/net/Rest.js";

class Account {

    async register(username, email, password) {
        const res = await Rest.post("/accounts/register", {
            username: username,
            email: email,
            password: password
        });
        if (res != null) {
            if (res.success) {
                alert("account registered successfully");
            } else {
                alert("the username or email you entered already exists");
            }
        } else {
            alert("something went wrong, please try again later");
        }
    }

    async login(username, password) {
        const res = await Rest.post("/accounts/login", {
            username: username,
            password: password
        });
        if (res != null) {
            if (res.success) {
                await CookieManager.set("token", res.token);
            } else {
                alert("incorrect login information");
            }
        } else {
            alert("something went wrong, please try again later");
        }
    }

    async logout() {
        const token = await CookieManager.getValue(token);
        await Rest.post("/accounts/logout", {token: token});
        await CookieManager.delete("token");
    }

    async isLoggedIn() {
        return await CookieManager.getValue("token") != "";
    }

}

export default new Account();
