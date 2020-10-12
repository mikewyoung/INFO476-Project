const express = require("express");
const axios = require("axios");
axios.defaults.headers.common = {
    "Content-Type": "application/json"
}
const http = require("http");

const config = require("./config.js");
const inputform = require("./inputform.js");

var app = express;

var players = [];

http.createServer(app).listen(config.port, function(err){
    if (err){
        throw err;
    }
    console.log(config.name + " listening on port " + config.port);

    // Data that will be sent to the login server to report this game server has come online.
    var serverData = {
        name: config.name,
        max_players: config.max_players,
        region: config.region,
        auth_token: config.auth_token,
        port: config.port
    }
    // Report to the login server that this server has come online
    axios({
        url: config.loginserver_url + "/gameServerOnline",
        method: "post",
        params: serverData
    }).then(function(res){
        if (res == 404){
            console.log("The authentication token for the login server was incorrect.");
            process.exit(1);
        }
    }).catch(function(error){
        console.log("Couldn't contact login server.");
    });
});