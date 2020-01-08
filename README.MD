# WebService

## Create a new WebService

To create a new WebService, it has to be initialized wit the corresponding port.\
If no port is specified, the default port 8001 will be set.\
Any number of ServiceModules can be added to the WebService.\
\
*Example:*

```JavaScript
// get the WebService
const WebService = require('webservice');
// get any ServiceModule
const ServiceModule = require('./ServiceModule.js');
// open WebService on port 8080
const service = new WebService(8080);
// register the ServiceModule to listen to the path '/service'
service.registerService(ServiceModule, "/service");
```

## Create a new ServiceModule

A ServiceModule can answer http requests send to the given path.\
To answer requests, bind a function to "onrequest".\
Additionally a WebSocket-Server can be created.\
\
*Example:*

```JavaScript
class ServiceModule {

    constructor(server) {
        // create a WebSocket-Server for the ServiceModule
        let wss = server.getWebSocket();
        wss.onmessage = function(sender, msg) {
            // return the data recieved by sender
            wss.send(sender, msg);
        };
        server.onrequest = function(method, query, body) {
            // return the data recieved by sender
            return body;
        };
    }

}
```

## Controlling the WebSocket

A very simplistic example of a chat service.\
\
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