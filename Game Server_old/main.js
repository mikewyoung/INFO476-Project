const config = require("./config.js");
const clientVersion = "test";

const uWS = require("uWebSockets.js");
const express = require("express");
const axios = require("axios");
const MongoClient = require("mongodb").MongoClient;
axios.defaults.headers.common = {
    "Content-Type": "application/json"
}
const {StringDecorder} = require("string_decoder");
const http = require("http");
const inputform = require("./inputform.js");
const { response } = require("express");
const { cursorTo } = require("readline");
const { MinKey } = require("mongodb");

var app = express();

var players = [];

// Establish a connection to MongoDB
// Create the MongoDB connection string
var connection_string = "mongodb+srv://" + config.mongodb_username + ":" + config.mongodb_password + "@" + config.mongodb_url + "?retryWrites=true&w=majority";

const client = new MongoClient(connection_string, {useUnifiedTopology: true});
var characters;
var database;

client.connect().then(function(result){
    database = client.db(config.mongodb_db);
    characters = database.collection("characters");
    console.log("Successfully connected to " + config.mongodb_db);
    initializeServer();
}, function(err){
    console.log(err);
});

function initializeServer(){
    var serverData = {
        auth_token: config.auth_token,
        port: config.port,
        region: config.region,
        max_players: config.max_players,
        name: config.name
    }

    axios({
        url: config.loginserver_url + "/gameServerOnline",
        method: "post",
        params: serverData
    }).then(function(res){
        if (res.status == 404){
            console.log("The authentication token for the login server was incorrect.");
            process.exit(1);
        }

        if (res.status == 200){
            startGameServer();
        }

    }).catch(function(error){
        console.log("Couldn't contact login server. Retrying in 10 seconds...");
        setTimeout(function(){
            initializeServer();
        }, 10000)
    });
}

function startGameServer(){
    uWS.App().ws("/game", {
        idleTimeout: 600, // In seconds
        maxBackpressure: 1024,
        maxPayloadLength: 512,
        compression: uWS.SHARED_COMPRESSOR,

        // Called during the upgrade process
        upgrade: (res, req, context) => {
            console.log('An Http connection wants to become WebSocket, URL: ' + req.getUrl() + '!');
        
            /* Keep track of abortions */
            const upgradeAborted = {aborted: false};

            /* You MUST copy data out of req here, as req is only valid within this immediate callback */            const url = req.getUrl();
            const secWebSocketKey = req.getHeader('sec-websocket-key');
            const secWebSocketProtocol = req.getHeader('sec-websocket-protocol');
            const secWebSocketExtensions = req.getHeader('sec-websocket-extensions');

            inputform.startForm();
            var auth_token = inputform.readString(req.getQuery());
            if (inputform.hasErrors == true){
                res.close();
                return
            }
            axios({
                url: config.loginserver_url + "/checkTempToken",
                method: "post",
                params: {t: auth_token}
            }).then(function(response){

                if (response.status == 200){
                    console.log(response.data.id + " successfully authenticated.");
                    
                    // Pass any vars to the websocket
                    res.upgrade({
                        url: url,
                        id: response.data.id,
                        token: auth_token,
                        connected: true
                    },
                    secWebSocketKey,
                    secWebSocketProtocol,
                    secWebSocketExtensions,
                    context);
                }
            }).catch(function(error){
                if (!error.response){
                    console.log("Couldn't contact login server.");
                    res.close();
                }else{
                    console.log("Bad login token tried.");
                    res.close();
                }
            });            
        
            /* You MUST register an abort handler to know if the upgrade was aborted by peer */
            res.onAborted(() => {
              /* We can simply signal that we were aborted */
                upgradeAborted.aborted = true;
            });
        },

        // Called when a connection is opened
        open: (ws) =>{
            // Get the player's information from the database.
            console.log("Connection opened");
            console.log(ws.id);
            console.log(ws.token);

            // Retrieve the characters and send them.
            characters.find({id: ws.id}).toArray().then(function(res){
                console.log(res);
            }, function(err){
                console.log(err);
            });

            
        },

        /* For brevity we skip the other events (upgrade, open, ping, pong, close) */
        message: function(ws, message, isBinary){
        },

        close: function(ws, code, message){
            ws.connected = false;
            console.log(ws.id + " disconnected.");
        }

    }).listen(config.port, function(listenSocket){
        if (listenSocket){
            console.log("Listening on port: " + config.port);
        }
    });
}

async function findCharacters(ws){
    foundCharacters = await characters.find({id: ws.id}).toArray();
    if (ws){
        var data = {
            e: 0,
            d: foundCharacters
        }
        console.log("iterating...");
        for(var i = 0; i < 5000000000; i++);
        console.log("done iterating");
        ws.send(JSON.stringify(data));
    }
}