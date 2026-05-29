import FileUploader from "@emcjs/core/util/file/FileUploader.js";
import {httpToWsUrl} from "jswebservice/client/WebSocketClient.js";

// HTTP
const response = await fetch("project/test");
const text = await response.text();
console.log("recieved http response:", text);

// WebSocket
const wsUrl = new URL("project/test", location);
wsUrl.port = "12346";
const ws = new WebSocket(httpToWsUrl(wsUrl));
ws.onmessage = (event) => {
    const msg = event.data;
    console.log("recieved ws message:", msg);
};
ws.onopen = () => {
    const msg = {
        type: "data",
        data: "Foobar"
    };
    ws.send(JSON.stringify(msg));
};

// upload
const fileUploader = new FileUploader();
const formEl = document.getElementById("form");
const fileEl = document.getElementById("file");
formEl.addEventListener("submit", (event) => {
    event.preventDefault();
    const file = fileEl.files[0];
    fileUploader.upload(file);
});
