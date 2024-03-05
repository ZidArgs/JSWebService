# WebService

## Create a new WebService

To create a new WebService, it has to be initialized wit the corresponding port.

If no port is specified, the default port 8001 will be set.

Any number of ServiceModules can be added to the WebService.


*Example:*

```JavaScript
// get the WebService
const WebService = require('webservice');
// get any service module
const ServiceModule = require('./ServiceModule.js');
// open WebService
const service = new WebService(/*port*/ 8080, /*options*/ {
    enableCors: false,
    logRequests: true
});
// register the service module to listen to the path '/service'
service.registerService(ServiceModule, "/service");
```

### WebService parameters
| parameter     | default              | effect                                           |
| ------------- | -------------------- | ------------------------------------------------ |
| accessManager | DefaultAccessManager | Set the `AccessManager` used for this WebService |
| enableCors    | false                | Set if the WebService is running in CORS mode    |
| logRequests   | false                | Should the WebService log all HTTP requests      |

## Using the StaticService

The StaticService is used to serve files directly from the filesystem.


*Example:*

```JavaScript
// get the StaticService module
const StaticService = require("webservice/services/StaticService.js");
// register the StaticService to listen to the path '/static'
service.registerService(StaticService, "/static", {
     // set the folder to be read to './mycontent' (optional; default = './static')
    serveFolder: "./mycontent",
    // set default index files (optional; default = ["index.html", "index.htm"])
    defaultIndex: "index.html index.json",
     // set mimeTypes (optional)
     /*
     default = {
        // typical website files
        "html?": "text/html; charset=utf-8",
        "css": "text/css; charset=utf-8",
        "m?js": "text/javascript; charset=utf-8",
        // most common image types
        "ico": "image/x-icon",
        "png": "image/png",
        "svg": "image/svg+xml",
        "jpe?g": "image/jpeg",
        "gif": "image/gif",
        "tiff?": "image/tiff",
        "bmp": "image/bmp",
        // configuration files
        "json": "application/json; charset=utf-8",
        "xml": "application/xml; charset=utf-8",
    }
     */
    mimeTypes: {
        "html?": "text/html; charset=utf-8"
    }
});
```


## Create a new ServiceModule

A ServiceModule can answer http requests send to the given path.

To answer requests, bind a function to "onrequest".

Additionally a WebSocket-Server can be created.


*Example:*

```JavaScript
class ServiceModule {

    constructor(server, options /*optional*/) {
        // create a WebSocket-Server for the ServiceModule
        let wss = server.getWebSocket();
        wss.onmessage = function(sender, msg) {
            // return the data recieved by sender
            wss.send(sender, msg);
        };
        server.onrequest = function(method, query, body) {
            // return json data which will be encoded and mimetype will be set
            return {
                status: 200,
                json: {
                    success: true,
                    payload: [...]
                }
            };
            // or return custom mime type and data
            return {
                status: 200,
                content: "<div>some html content</div>",
                options: { /*optional*/
                    type: "text/html; charset=utf-8",
                    nocache: false,
                    length: 28,
                    language: "en"
                }
            };
            // or return a data stream
            return {
                status: 200,
                stream: fs.createReadStream("myfile"),
                options: { /*optional*/
                    type: "text/plain; charset=utf-8",
                    nocache: true
                }
            };
        };
    }

}
```

## Controlling the WebSocket

A very simplistic example of a chat service.


*Example:*

```JavaScript
class ChatModule {

    constructor(server) {
        let wss = server.getWebSocket();

        wss.onconnect = function(sender) {
            // tell all other peers that a new peer has connected
            wss.sendAllBut(sender, sender + " connected to the server");
        };
        
        wss.onmessage = function(sender, msg) {
            if (msg.type === "kick") {
                // close senders connection
                wss.close(msg.reciever);
            }

            let data = {
                sender: sender,
                body: msg.body
            };

            if (!!msg.reciever) {
                if (Array.isArray(msg.reciever)) {
                    // send the message to multiple users
                    wss.sendMulti(msg.reciever, data);
                } else {
                    // send the message to one user
                    wss.send(msg.reciever, data);
                }
            } else {
                // send the message to everyone but the sender
                wss.sendAllBut(sender, data);
            }
        };

        wss.onclose = function(sender) {
            // tell all remaining peers that a peer has left
            wss.sendAll(sender + " disconnected from the server");
        };

    }

}
```