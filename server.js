import WebService from "./src/WebService.js";
import StaticService from "./src/services/StaticService.js";
import FileUploadService from "./src/services/FileUploadService.js";
import TestResponseService from "./src/services/TestResponseService.js";
import LocalProxy from "./src/utils/LocalProxy.js";

const enableCors = process.argv.indexOf("-cors") >= 1;
const port = process.argv.indexOf("-port") >= 1 ? process.argv[process.argv.indexOf("-port") + 1] : "12345";

// remote service
const remoteService = new WebService("12346", {
    useSessions: true,
    logRequests: true
});
remoteService.registerServiceModule(StaticService, "", {serveFolder: "./webtest"});
remoteService.registerServiceModule(StaticService, "_libs/emcjs/core", {serveFolder: "./node_modules/@emcjs/core/src"});
remoteService.registerServiceModule(StaticService, "_libs/jswebservice", {serveFolder: "./src"});
remoteService.registerServiceModule(FileUploadService, "upload", {targetFolder: "./_upload"});
remoteService.registerServiceModule(TestResponseService, "project/{project}");
remoteService.registerServiceModule(StaticService, "get_upload", {serveFolder: "./_upload"});

remoteService.permissions.setPublic()
    .configurePath("get_upload").setPrivate();

// public service
const service = new WebService(port, {
    enableCors,
    logRequests: true
});
const localProxy = new LocalProxy("12346");
service.registerLocalProxy(localProxy, "");
service.addRewriteRule({
    conditions: [
        ".*"
    ],
    matcher: ".*",
    rewrite: "/"
});

service.printServerInfoPanel();
