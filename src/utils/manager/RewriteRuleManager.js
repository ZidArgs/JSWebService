import LoggableMixin from "../../mixins/LoggableMixin.js";

export default class RewriteRuleManager extends LoggableMixin() {

    #rewriteRules = new Set();

    add(rule) {
        if (typeof rule !== "object" || Array.isArray(rule)) {
            throw new TypeError("dict expected");
        }

        const {conditions, matcher, rewrite} = rule;

        if (!(matcher instanceof RegExp || typeof matcher === "string") || matcher === "") {
            throw new Error("mandatory property \"matcher\" must be a RegExp or a non empty string");
        }
        if (typeof rewrite !== "string" || rewrite === "") {
            throw new Error("mandatory property \"rewrite\" must be a non empty string");
        }
        if (conditions != null) {
            if (!Array.isArray(conditions)) {
                throw new Error("optional property \"conditions\" must be an array");
            }
            for (const condition of conditions) {
                if (!(condition instanceof RegExp || typeof condition === "string") || condition === "") {
                    throw new Error("all conditions must be a RegExp or a non empty string");
                }
            }
        }

        const res = {
            conditions: [],
            matcher: null,
            rewrite: rule.rewrite
        };

        if (!(matcher instanceof RegExp)) {
            res.matcher = new RegExp(matcher);
        } else {
            res.matcher = matcher;
        }

        for (const condition of conditions) {
            if (!(condition instanceof RegExp)) {
                res.conditions.push(new RegExp(condition));
            } else {
                res.conditions.push(condition);
            }
        }

        this.#rewriteRules.add(res);
        this.logger.log(`register rewrite: [${res.conditions.join(",")}] ${res.matcher} => "${res.rewrite}"`);
    }

    rewrite(pathName) {
        for (const rule of this.#rewriteRules) {
            const {conditions, matcher, rewrite} = rule;
            this.logger.log(`testing rewrite: [${conditions.join(",")}] ${matcher} => "${rewrite}"`);
            if (this.#matchesRuleConditions(conditions, pathName)) {
                const result = pathName.replace(matcher, rewrite);
                this.logger.log(`rewriting path: "${pathName}" => "${result}"`);
                return result;
            }
        }
        return pathName;
    }

    #matchesRuleConditions(conditions, pathName) {
        for (const condition of conditions) {
            if (!condition.test(pathName)) {
                return false;
            }
        }
        return true;
    }

}
