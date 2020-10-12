module.exports = {
    // HTTP configuration
    port: process.env.port || 5001, // Port the server itself is hosted on

    // Server configuration
    // 0 = US, 1 = Europe, 2 = Asia
    region: process.env.region || 0,
    max_players: process.env.max_players || 500,
    name: process.env.name || "Server",
    loginserver_url: process.env.loginserver_url || "http://127.0.0.1:5000",

    // If set to true, only premium accounts will be able to play
    premium: process.env.premium || false,

    // MySQL configuration
    mysql_ip: process.env.mysql_ip || "127.0.0.1",
    mysql_port: process.env.mysql_port || 3306,
    mysql_username: process.env.mysql_username || "root",
    mysql_password: process.env.mysql_password || "1",
    mysql_database: process.env.mysql_database || "info476",

    // MongDB configuration
    mongodb_ip: process.env.mongodb_ip || "127.0.0.1",
    mongodb_port: process.env.mongodb_port || 27017,
    mogodb_username: process.env.mongodb_username || "root",
    mongodb_password: process.env.mongodb_port || "",

    //Auth Token
    auth_token: process.env.auth_token || "authToken" // A game server will need to know this in order to connect

}