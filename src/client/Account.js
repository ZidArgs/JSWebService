import Cookie from "@emcjs/core/data/storage/global/Cookie.js";
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
                Cookie.set("token", res.token);
            } else {
                alert("incorrect login information");
            }
        } else {
            alert("something went wrong, please try again later");
        }
    }

    async logout() {
        const token = Cookie.get(token);
        await Rest.post("/accounts/logout", {token: token});
        Cookie.delete("token");
    }

    isLoggedIn() {
        return Cookie.get("token") != "";
    }

}

export default new Account();
