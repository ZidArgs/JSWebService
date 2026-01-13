import {httpToWsUrl} from "../src/client/WebSocketClient.js";

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
