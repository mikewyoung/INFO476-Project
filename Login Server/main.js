const express = require("express");
const bcrypt = require("bcrypt");
const mysql = require("mysql");
const http = require("http");
const inputform = require("./inputform");
var app = express();

// Configuration file
// Note that all of the configuration variables can be changes on launch via environmental variables, so that way github commits don't have passwords stored in them
const config = require("./config.js")

// Initiate the MySQL DB connection
var con = mysql.createConnection({
    host: config.mysql_ip,
    port: config.mysql_port,
    user: config.mysql_username,
    password: config.mysql_password,
    database: config.mysql_database
});

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
                    res.send(401); // Send an unauthorized HTTP response code
                }else{
                    var hashed_pass = result[0].user_pass; // Keys of the DB are stored as properties of a json object, so the property "user_pass" of the first key is the hashed password to compare.
                    bcrypt.compare(password, hashed_pass, function(err, result){
                        if (err){
                            throw err;
                        }

                        // Some anti-flooding measures will be implemented here later, to prevent bruteforce attacks
                        // As well as flooding the server with slow bcypt requests
                        if (result == true){
                            console.log(username + "authenticated successfully.");
                            res.send("token");
                        }else{
                            console.log("Wrong password tried for " + username);
                            res.send(401);

                        }
                    })

                }
            })

        }else{
            res.send(400) // Bad request 400, since one or two of the inputs were not strongs.
        }
    })
}