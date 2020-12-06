const uWS = require("uWebSockets.js");
const inputform = require("./inputform.js");
const querystring = require("querystring");
config = require("./config.js");
Game = require("./gamelogic.js");
const decoder = new TextDecoder();

let lobbies = [];

var lobbyNum = 0;

function createLobby(name, maxPlayers, private){
    var lobby = {
        code: lobbyNum,
        private: private,
        maxPlayers: maxPlayers,
        name: name,
        game: new Game()
    }
    lobbies.push(lobby);
    lobbyNum++;
    return lobby.code;
}

uWS.App().ws("/code", {
    idleTimeout: 600, // In seconds
    maxBackpressure: 1024,
    maxPayloadLength: 512,
    compression: uWS.SHARED_COMPRESSOR,

    // Called during the upgrade process
    upgrade: (res, req, context) => {
        console.log('An HTTP connection wants to become WebSocket, URL: ' + req.getUrl() + '!');
    
        /* Keep track of abortions */
        const upgradeAborted = {aborted: false};

        /* You MUST register an abort handler to know if the upgrade was aborted by peer */
        res.onAborted(() => {
        /* We can simply signal that we were aborted */
            upgradeAborted.aborted = true;
        });

        /* You MUST copy data out of req here, as req is only valid within this immediate callback */           
        const url = req.getUrl();
        const secWebSocketKey = req.getHeader('sec-websocket-key');
        const secWebSocketProtocol = req.getHeader('sec-websocket-protocol');
        const secWebSocketExtensions = req.getHeader('sec-websocket-extensions');

        var queryParams = querystring.decode(req.getQuery());

        inputform.startForm();
        var lobby_code = inputform.readString(queryParams.c);
        var name = inputform.readString(queryParams.n, {maxLength: 16});

        // Close the upgrade before trying any matchmaking if we don't get the expected data.
        if (inputform.hasErrors == true){
            res.close();
            return;
        }

        var found;

        if (lobby_code == "c"){
            found = createLobby("test_name", 10, false);
            console.log(found);
        }else{
            lobby_code = parseInt(lobby_code);
            found = -1;
            if (lobby_code != NaN){
                lobbies.forEach(function(lobby){
                    if (lobby.code == lobby_code){
                        found = lobby.code;
                    }
                })
            }
        }

        if (found != -1){
            res.upgrade({
                url: url,
                connected: true, // This is just a way to tell if the client is still open, since the uWebSocketsjs library doesn't actually support checking if the connection is alive
                name: name,
                lobby: found
            },
            secWebSocketKey,
            secWebSocketProtocol,
            secWebSocketExtensions,
            context);
        }else{
            console.log("No lobby with code found; disconnecting.");
            res.close();
        }
        
    },

    // Called when a connection is opened
    open: (ws) =>{
        // Get the player's information from the database.
        console.log("Connection opened");
        var found = false;
        lobbies.forEach(function(lobby){
            if (lobby.code == ws.lobby){
                found = true;
                lobby.game.addPlayer(ws);
            }
        })

        if (found == false){
            ws.close();
        }
    },


    message: function(ws, message, isBinary){
        var foundLobby = -1;

        for(var i = 0; i < lobbies.length; i++){
            if (lobbies[i].code == ws.lobby){
                foundLobby = lobbies[i];
            }
        }

        if (foundLobby != -1){
            // The UWS socket handles all data as arraybuffer, so it must be decoded.
            foundLobby.game.processMessage(ws, decoder.decode(message));
        }else{
            ws.close();
        }
    },

    close: function(ws, code, message){
        ws.connected = false;
        console.log(ws.name + " disconnected.");
        if (typeof ws.lobby != "undefined"){
            lobbies.forEach(function(lobby){
                if (lobby.code == ws.lobby){
                    lobby.game.removePlayer(ws);
                    if (lobby.game.players.length <= 0){
                        console.log("Purged lobby " + lobby.code + " due to lack of players.");
                        lobbies.splice(lobbies.indexOf(lobby), 1);
                    }   
                    
                    
                }
            })
        }
    }

}).listen(config.port, (token) => {
    if (token) {
        console.log('Listening to port ' + config.port);
    } else {
        console.log('Failed to listen to port ' + config.port);
    }
});