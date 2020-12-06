// Configuration file
// Note that all of the configuration variables can be changes on launch via environmental variables, so that way github commits don't have passwords stored in them
const config = require("./config.js");

const express = require("express");
const bcrypt = require("bcrypt");
const mysql = require("mysql");
const http = require("http");
const { v4: uuidv4 } = require('uuid');

const inputform = require("./inputform");
var app = express();

// Enable cross-origin requests
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://127.0.0.1"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// Initiate the MySQL DB connection
var con = mysql.createConnection({
    host: config.mysql_ip,
    port: config.mysql_port,
    user: config.mysql_username,
    password: config.mysql_password,
    database: config.mysql_database
});

// This array keeps track of the game servers currently online.
var gameServers = [];
var authTokens = [];

// This timer will loop endlessly, in order to make sure authentication tokens expire if left unused.
var expireTokens = setInterval(function(){
    authTokens.forEach(function(authToken){
        authToken.timeLeft--;

        // Remove the auth token after the time ticks down to zero.
        if (authToken.timeLeft < 0){
            authTokens.splice(authTokens.indexOf(authToken), 1);
        }
    })
}, 1000);

con.connect(function(err){
    if (err) {
        throw err
    };
    console.log("Connected to the MySQL server running on " + config.mysql_ip + ":" + config.mysql_port);

    // Start listening for HTTP requests when the MySQL database connection has been established
    http.createServer(app).listen(config.port, function(err){
        if (err){
            throw err;
        }
        console.log("Server listening on port " + config.port);
        startServer();
    });
});

function startServer(){
    app.post("/loginGame", function(req, res){

        // Documentation about the inputform library can be found in the inputform.js file
        inputform.startForm()
        var username = inputform.readString(req.query['u'], {maxLength: 60});
        var password = inputform.readString(req.query['p'], {maxLength:255});
        
        if (inputform.hasErrors() == false){
            var query = "SELECT * FROM wp_users WHERE user_login = ?";
            // The MySQL library included with NodeJS will escape illegal characters using the ? placeholder method for queries

            con.query(query, [username], function(err, result){
                if (err){
                    throw err;
                }

                // The result of a MySQL query in NodeJS is an array. An array with a length of zero means nothing was found.
                if(result.length == 0){
                    console.log("No user found: " + username);
                    res.sendStatus(401); // Send an unauthorized HTTP response code
                }else{
                    var hashed_pass = result[0].user_pass; // Keys of the DB are stored as properties of a json object, so the property "user_pass" of the first key is the hashed password to compare.
                    var pid = result[0].ID;
                    bcrypt.compare(password, hashed_pass, function(err, result){
                        if (err){
                            throw err;
                        }

                        // Some anti-flooding measures will be implemented here later, to prevent bruteforce attacks
                        // As well as flooding the server with slow bcypt requests
                        if (result == true){
                            console.log(username + " authenticated successfully.");
                            var token = uuidv4();
                            var serverList = [];
                            var serverIPs = [];
                            var serverPlayers = [];
                            var serverRegions = [];
                            var serverMaxPlayers = [];

                            gameServers.forEach(function(gameServer){
                                serverList.push(gameServer.name);
                                serverIPs.push(gameServer.ip + ":" + gameServer.port);
                                serverPlayers.push(gameServer.players.length);
                                serverRegions.push(gameServer.region);
                                serverMaxPlayers.push(gameServer.max_players);
                            })

                            authTokens.forEach(function(authToken){
                                if (authToken.id == pid){
                                    authTokens.splice(authTokens.indexOf(authToken), 1);
                                }
                            });

                            res.send(JSON.stringify({t: token, servers: JSON.stringify(serverList), ips: JSON.stringify(serverIPs), max_players: JSON.stringify(serverMaxPlayers), players: JSON.stringify(serverPlayers), regions: JSON.stringify(serverRegions)}));
                            authTokens.push({id: pid, token: token, timeLeft: 120});
                        }else{
                            console.log("Wrong password tried for " + username);
                            res.sendStatus(401);
                        }
                    })

                }
            })

        }else{
            res.send(400); // Bad request 400, since one or two of the inputs were not strongs.
        }
    })

    // Listen for a game server to be online
    app.post("/gameServerOnline", function(req, res){
        inputform.startForm();
        var auth_token = inputform.readString(req.query["auth_token"]);

        if (auth_token != config.auth_token || inputform.hasErrors() == true){
            res.sendStatus(404);
            return;
        }

        var data = req.query;
        var ip = req.connection.remoteAddress;

        // Some IPs start with ::ffff:, so this will remove them.
        ip = ip.replace("::ffff:", "");

        var newGameServer = {name: data.name, ip: ip, port: data.port, region: data.region, max_players: data.max_players, players: []};

        // Add a new server to the list of them online.
        gameServers.push(newGameServer);

        // Send an OK status code
        res.sendStatus(200);
        console.log(newGameServer.name + " is now online.");
    })

    // Post request for the game server
    app.post("/checkTempToken", function(req, res){
        inputform.startForm();
        var auth_token = inputform.readString(req.query["t"]);
        console.log(auth_token);

        if (inputform.hasErrors() == true){
            res.sendStatus(401);
            return;
        }

        var foundToken = false; // Placeholder variable for the following loop
        var foundId;

        authTokens.forEach(function(authToken){
            console.log(authToken.token);
            console.log(auth_token);
            if (authToken.token == auth_token){
                foundToken = true;
                foundId = authToken.id;
                authTokens.splice(authTokens.indexOf(authToken), 1);
                
            }            
        })

        if (foundToken == true){
            console.log(foundId + " authed successfully.");
            res.status(200).json({id: foundId});
        }else{
            console.log("Unsuccessful auth");
            res.sendStatus(401);
        }

    })
}