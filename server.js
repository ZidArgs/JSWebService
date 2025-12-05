import WebService from "jswebservice/WebService.js";
import StaticService from "./src/services/StaticService.js";
import TestResponseService from "./src/services/TestResponseService.js";
import LocalProxy from "./src/utils/LocalProxy.js";

const enableCors = process.argv.indexOf("-cors") >= 1;
const port = process.argv.indexOf("-port") >= 1 ? process.argv[process.argv.indexOf("-port") + 1] : "12345";

// remote service
const remoteService = new WebService("12346", {useSessions: true});
remoteService.registerServiceModule(StaticService, "", {serveFolder: "./webtest"});
remoteService.registerServiceModule(TestResponseService, "project/{project}");

// public service
const service = new WebService(port, {enableCors});
const localProxy = new LocalProxy("12346");
service.registerLocalProxy(localProxy, "");
service.addRewriteRule({
    conditions: [
        ".*"
    ],
    matcher: ".*",
    rewrite: "/"
});

const po = service.port.toString().padEnd(5);

console.log(``);
console.log(`╔════════════════════════════════════════╗`);
console.log(`║ ┌╦┐ ╭────────────────────────────╮ ┌╦┐ ║`);
console.log(`║  │  │                            │  │  ║`);
console.log(`╠─═╬═─╡   http://localhost:${po}   ╞─═╬═─╣`);
console.log(`║  │  │                            │  │  ║`);
console.log(`║ └╩┘ ╰────────────────────────────╯ └╩┘ ║`);
console.log(`╚════════════════════════════════════════╝`);
console.log(``);
