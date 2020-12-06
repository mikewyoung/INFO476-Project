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

    // MongDB configuration
    mongodb_url: process.env.mongodb_url,
    mongodb_db: process.env.mongodb_db,

    mongodb_username: process.env.mongodb_username,
    mongodb_password: process.env.mongodb_password,

    //Auth Token
    auth_token: process.env.auth_token || "authToken" // A game server will need to know this in order to connect

}