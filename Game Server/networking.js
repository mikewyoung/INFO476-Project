var Server;
var charData;
var players = [];
var weaponPickups = [];

// Key constants
// More need to be added if more are added in the client
const LEFT = 0;
const RIGHT = 1;
const JUMP = 2;
const CROUCH = 3;

// Game state constants
const WAITING = 0;
const IN_GAME = 1;

function connectGame(url, code, name){
    Server = new WebSocket("ws://" + url + "/code?c="+code+"&n="+name);

    Server.onopen = function(){
        console.log("Connected to server successfully");

        // Clear the player array.
        players.splice(0, players.length);
    }

    Server.onclose = function(event){
        console.log("Disconnected from server.");
    }

    Server.onerror = function(event){
        console.log("Error connecting to server");
        gml_Script_gmcallback_errorConnecting(-1, -1, "Connecting failed. The server is down or that lobby doesn't exist.");
    }

    Server.onmessage = function(event){
        message = JSON.parse(event.data);
        switch(message.e){

            // Join the game
            case 0:{
                players = message.p;
                weaponPickups = message.w;
                console.log(weaponPickups);
                if (!message.h){
                    gml_Script_gmcallback_joinGame(-1, -1, message.r, false, message.s);
                }else{
                    gml_Script_gmcallback_joinGame(-1, -1, message.r, true, message.s);
                }
            }
            break;

            // Keyboard press
            case 1:{
                gml_Script_gmcallback_keyPress(-1, -1, message.p, message.k);
            }
            break;

            // Keyboard release
            case 2:{
                gml_Script_gmcallback_keyRelease(-1, -1, message.p, message.k);
            }
            break;

            // Player joins
            case 3:{
                players.push(message.p);
                gml_Script_gmcallback_createPlayer(-1, -1, message.p.pid, message.p.n, message.p.s, message.p.w, message.p.p[0], message.p.p[1], message.p.h, message.p.t, message.p.z);
                
            }
            break;

            // Player disconnects
            case 4:{
                var name = "";
                for (var i = 0; i < players.length; i++){
                    if (players.pid == message.p){
                        name = players.n;
                        break;
                    }
                }
                gml_Script_gmcallback_destroyPlayer(-1, -1, message.p, name);
            }
            break;

            // Receive player data
            case 5:{
                for(var i = 0; i < message.d.length; i++){
                    for(var j = 0; j < players.length; j++){
                        if (message.d[i][0] == players[j].pid){
                            // Update coordinates and weapon rotation
                            // The arrays do not line up because the first spot is occupied by the player Id in the incoming message.
                            players[j].p[0] = message.d[i][1];
                            players[j].p[1] = message.d[i][2];
                            players[j].p[2] = message.d[i][3];
                        }
                    }
                }
                gml_Script_gmcallback_updateCoordinates();
            }
            break;

            // Receive shot info
            case 6:{
                gml_Script_gmcallback_shootBullet_other(-1, -1, message.p, message.c[0], message.c[1], message.c[2]);
            }
            break;

            // Pickup weapon
            case 7:{
                var pid = message.w[0];
                var weapon = message.w[1];
                gml_Script_gmcallback_pickupWeapon(-1, -1, pid, weapon);
            }
            break;

            // Pickup weapon (self)
            case 8:{
                var weapon = message.w[0];
                var ammo = message.w[1];
                var ammo_reserve = message.w[2];
                gml_Script_gmcallback_pickupWeapon_self(-1, -1, weapon, ammo, ammo_reserve);
            }
            break;

            // Create weapon pickup
            case 9:{
                var id = message.p[0];
                var weapon = message.p[1];
                var x = message.p[2];
                var y = message.p[3];
                gml_Script_gmcallback_createWeaponPickup(-1, -1, id, weapon, x, y);
            }
            break;

            case 10:{
                var id = message.p;
                gml_Script_gmcallback_destroyWeaponPickup(-1, -1, id);
            }
            break;

            case 11:{
                var pid = message.p[0];
                var time = message.p[1];
                gml_Script_gmcallback_reload(-1, -1, pid, time);
            }
            break;

            // Other player takes damage
            case 12:{
                if (typeof message.c == "undefined"){
                    gml_Script_gmcallback_damageOther(-1, -1, message.p, message.d);
                }else{
                    gml_Script_gmcallback_damageOther(-1, -1, message.p, message.d, message.c[0], message.c[1]);
                    gml_Script_gmcallback_shootWeapon_Visual(-1, -1, message.a);
                }
            }
            break;

            // Player takes damage
            case 13:{
                if (message.c){
                    gml_Script_gmcallback_damageSelf(-1, -1,message.d, message.c[0], message.c[1]);
                }else{
                    gml_Script_gmcallback_damageSelf(-1, -1, message.d);
                }
                if (typeof message.a !== undefined){
                    console.log("Incoming attack from pid " + message.a);
                    gml_Script_gmcallback_shootWeapon_Visual(-1, -1, message.a);
                }
                
            }
            break;

            // Become the new host
            case 14:{
                gml_Script_gmcallback_becomeHost()
            }
            break;

            // Enemy lunges
            case 15:{
                var x = message.c[0];
                var y = message.c[1];
                var spd = message.c[2];
                var pid = message.p;
                gml_Script_gmcallback_lungeOther(-1, -1, pid, x, y, spd);
            }
            break;

            // start game
            case 16:{
                var roles = message.r;
                var self_role = message.s;
                var map = message.m;
                for (var i = 0; i < players; i++){
                    players[i].z = 0;
                    for(var j = 0; j < roles.length; j++){
                        if (roles[j][0] == players[i].pid){
                            players[i].team = roles[j][1];
                        }
                    }
                }
                gml_Script_gmcallback_startGame(-1, -1, map, self_role, time);
            }
            break;

            // Spawn player
            case 17:{
                var pid = message.p;
                var zombie_class = message.z;
                var pos = message.c;

                var existingPlayer;
                for (var i = 0; i < players.length; i++){
                    if (players[i].pid == pid){
                        existingPlayer = players[i];
                    }
                }

                existingPlayer.p = pos;
                existingPlayer.z = zombie_class;

                gml_Script_gmcallback_spawnPlayer(-1, -1, pid, existingPlayer.n, existingPlayer.s, 0, existingPlayer.p[0], existingPlayer.p[1], message.h, existingPlayer.t, existingPlayer.z);
            }
            break;

            // Spawn self
            case 18: {
                console.log(message);
                gml_Script_gmcallback_spawnPlayer(-1, -1, -1, "", 0, 0, message.c[0], message.c[1], message.h, message.t, message.z);
            }
            break;

            // Kill other
            case 19: {
                gml_Script_gmcallback_killPlayer(-1, -1, message.p);
            }
            break;

            case 20:{
                gml_Script_gmcallback_killPlayer(-1, -1, -1);
            }
            break;
        }
    }

}

function sendKeyPress(keyCode){
    var msg = JSON.stringify({
        e: 1,
        k: keyCode
    })
    Server.send(msg);
}

function sendKeyRelease(keyCode){
    var msg = JSON.stringify({
        e: 2,
        k: keyCode
    })
    Server.send(msg);
}

function createPlayers(){
    for(var i = 0; i < players.length; i++){
        gml_Script_gmcallback_spawnPlayer(-1, -1, players[i].pid, players[i].n, players[i].s, players[i].w, players[i].p[0], players[i].p[1], players[i].h, players[i].t, players[i].z);
    }
}

function sendCoordinates(x, y, rot){
    var coords = {
        e: 3,
        c: [x, y, rot]
    }
    
    Server.send(JSON.stringify(coords));
}

function getCoordinates(pid){
    // This needs to be stringified because the engine I'm using can't take raw json or multiple return values unfortunately.
    var player = -1;
    for (var i = 0; i < players.length; i++){
        if (players[i].pid == pid){
            player = players[i];
            break;
        }
    }
    if (player != -1){
        return JSON.stringify({
            x: player.p[0],
            y: player.p[1],
            rot: player.p[2]
        });
    }
}

function readInitialKeys(pid){
    for (var i = 0; i < players.length; i++){
        if (players[i].pid == pid){
            if (players[i].k.left == true){
                gml_Script_gmcallback_keyPress(pid, LEFT);
            }

            if (players[i].k.right == true){
                gml_Script_gmcallback_keyPress(pid, RIGHT);
            }

            if (players[i].k.jump == true){
                gml_Script_gmcallback_keyPress(pid, JUMP);
            }

            if (players[i].k.crouch == true){
                gml_Script_gmcallback_keyPress(pid, CROUCH);
            }
        }
    }
}

function sendWeaponRotation(rot){
    Server.send(JSON.stringify({e: 4, r: rot}));
}

function pickupWeaponReserve(id){
    Server.send(JSON.stringify({e: 6, i: id}))
}

function createWeaponPickups(){
    for (var i = 0; i < weaponPickups.length; i++){
        gml_Script_gmcallback_createWeaponPickup(-1, -1, weaponPickups[i][0], weaponPickups[i][1], weaponPickups[i][2], weaponPickups[i][3]);
    }
    weaponPickups = [];
}

function shootWeapon(x, y, angle){
    Server.send(JSON.stringify({
        e: 5, 
        c: [x, y, angle]
    }))
}

function sendReload(time){
    var msg = JSON.stringify({e: 7, t: time});
    Server.send(msg);
}

function completeReload(amount){
    var msg = JSON.stringify({e: 8, a: amount})
    Server.send(msg);
}

function doDamageOther(pid, damage, x, y){
    var msg = {e: 9, p: pid, d: damage, x: x, y: y};
    Server.send(JSON.stringify(msg));
}

function lunge(x, y, spd){

    var msg = {e: 10, c: [x, y, spd]};

    Server.send(JSON.stringify(msg));

}

function startGame(){
    var msg = {e: 11};
    Server.send(JSON.stringify(msg));
}

function selfSpawn(x, y, zc){
    Server.send(JSON.stringify({e: 12, c: [x, y], z: zc}));
    console.log("Sending spawn request")
}