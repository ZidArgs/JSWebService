// HTTP
const response = await fetch("project/test");
const text = await response.text();
console.log("recieved http response:", text);

// WebSocket
const ws_url = new URL("project/test", location);
ws_url.port = "12346";
ws_url.protocol = ws_url.protocol.replace("http", "ws");
const ws = new WebSocket(ws_url);
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
