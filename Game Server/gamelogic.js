const inputform = require("./inputform.js");

// Game state constants
const WAITING = 0;
const IN_GAME = 1;

// Room constants
const LOBBY = 0;
const MAP1 = 1;

// Keycode constants
const LEFT = 0;
const RIGHT = 1;
const JUMP = 2;
const CROUCH = 3;

const TEAM_SCIENTIST = 0;
const TEAM_HUNTER = 1;
const TEAM_SPECTATOR = 2;
const TEAM_LOBBY = 3;

var zombie_health = [];
zombie_health[0] = 20;
zombie_health[1] = 65;
zombie_health[2] = 100;

const numWeapons = 2; // This is used for input validation and must be changed when a new weapon is added to the client.

class Game {
    constructor(){
        this.players = []
        this.gameState = WAITING
        this.pid = 0;
        this.weaponPickups = [];
        this.pickupId = 0;
        this.selectedMap = MAP1;
        this.roundTime = 600000; // 10 minutes

        // FOR DEBUG PURPOSES - REMOVE AFTER
        this.createWeaponPickup(300, 100, 1, 12, 100);

        this.createWeaponPickup(400, 100, 2, 24, 100);

        var game = this;
        var tickInterval = 167;
        this.tick = setInterval(function(){
            var sendArray = [];
            for(var i = 0; i < game.players.length; i++){
                if (game.players[i].updated_coordinates == true){
                    sendArray.push([game.players[i].pid, game.players[i].pos[0], game.players[i].pos[1], game.players[i].pos[2]]);
                    game.players[i].updated_coordinates = false;
                }
            }
            if (sendArray.length > 0){
                game.broadcast(JSON.stringify({e: 5, d: sendArray}));
            }

            if (this.gameState != WAITING){
                this.roundTime -= tickInterval;
                if (this.roundTime <= 0){
                    // End game
                }
            }

        }, tickInterval);
    }
}

Game.prototype.startGame = function(){
    this.weaponPickups = [];
    this.gameState = IN_GAME;
    this.selectedMap = MAP1;
    this.pickupId = 0;
    var survivors = [];
    var zombies = [];
    var currentPlayers = this.players.sort(() => 0.5 - Math.random());
    var numZombies = Math.ceil(this.players.length * .3);
    var selectedZombies = currentPlayers.slice(0, numZombies);
    var roles = [];
    for(var i = 0; i < this.players.length; i++){
        if (selectedZombies.includes(this.players[i])){
            this.players[i].team = TEAM_HUNTER;
            this.players[i].hp = 0;
        }else{
            this.players[i].team = TEAM_SCIENTIST;
        }
        roles.push([this.players[i].pid], this.players[i].team);
    }

    for (var i = 0; i < this.players.length; i++){
        var msg = {e: 16, r: roles, m: this.selectedMap, s: this.players[i].team};
        this.players[i].id.send(JSON.stringify(msg));
    }

    this.createWeaponPickup(406, 648, 1, 12, 100);
    this.createWeaponPickup(300, 648, 2, 24, 100);

    

}

Game.prototype.changeTeam = function(pid, team){

}

Game.prototype.addPlayer = function(ws){
    var player = {
        health: 0,
        id: ws,
        pid: this.pid,
        updated_coordinates: false,
        weapon: 0,
        alive: true, // Change this later
        skin: 0,
        active: false,
        keys: {left: false, right: false, jump: false, crouch: false},
        pos: [0, 0, 0],
        ammo: 0,
        ammo_reserve: 0,
        team: TEAM_SCIENTIST,
        zombie_class: 0
    }

    if (this.players.length == 0){
        player.host = true;
    }
    

    var sendPlayers = [];
    for (var i = 0; i < this.players.length; i++){
        var sendPlayer = {
            pid: this.players[i].pid,
            n: this.players[i].id.name,
            k: this.players[i].keys,
            p: this.players[i].pos,
            s: this.players[i].skin,
            w: this.players[i].weapon,
            h: this.players[i].health,
            t: this.players[i].team,
            z: this.players[i].zombie_class
        }
        sendPlayers.push(sendPlayer);
    }

    var sendPickups = [];
    for (var i = 0; i < this.weaponPickups.length; i++){
        var pickupId = this.weaponPickups[i].id;
        var weapon = this.weaponPickups[i].weapon;
        var x = this.weaponPickups[i].x;
        var y = this.weaponPickups[i].y;
        sendPickups.push([pickupId, weapon, x, y]);
    }

    var joinPacket = {
        e: 0,
        p: sendPlayers,
        w: sendPickups, // weapon pickups
        s: this.gameState,
        t: this.roundTime
    }
    
    if (this.gameState == WAITING){
        joinPacket.r = LOBBY;
    }else{
        joinPacket.r = this.selectedMap;
    }

    if (player.host == true){
        joinPacket.h = true;
    }

    
    ws.send(JSON.stringify(joinPacket));

    
    this.broadcast(JSON.stringify({
        e: 3,
        p: {pid: player.pid, n: player.id.name, k: player.keys, p: player.pos, s: player.skin, w: player.weapon, h: player.health, t: player.team}
    }), player.pid)

    this.players.push(player);

    this.pid++;
}

Game.prototype.processMessage = function(ws, message){
    try{
        var message = JSON.parse(message);
    }catch(err){
        console.log("WS sent invalid data; disconnecting.")
        console.log(err);
        ws.close();
        return;
    }

    if (ws.connected == false){
        return;
    }

    inputform.startForm();
    message.e = inputform.readNumber(message.e);
    if (inputform.hasErrors() == true){
        return;
    }

    switch(message.e){

        // Press button
        case 1:{

            var key = inputform.readNumber(message.k);
            if (inputform.hasErrors() == true){
                return;
            }
            
            for(var i = 0; i < this.players.length; i++){
                if (this.players[i].id == ws){
                    
                    switch(message.k){
                        case LEFT:{
                            this.players[i].keys.left = true;
                        }
                        break;

                        case RIGHT:{
                            this.players[i].keys.right = true;
                        }
                        break;

                        case JUMP:{
                            this.players[i].keys.jump = true;
                        }
                        break;

                        case CROUCH:{
                            this.players[i].keys.crouch = true;
                        }
                        break;
                    }

                    this.broadcast(JSON.stringify({e: 1, p: this.players[i].pid, k: message.k}), this.players[i].pid);

                    break;
                }
            }
        }
        break;

        // Release button
        case 2:{

            var key = inputform.readNumber(message.k);
            if (inputform.hasErrors() == true){
                return;
            }
            
            for(var i = 0; i < this.players.length; i++){
                if (this.players[i].id == ws){
                    
                    switch(message.k){
                        case LEFT:{
                            this.players[i].keys.left = false;
                        }
                        break;

                        case RIGHT:{
                            this.players[i].keys.right = false;
                        }
                        break;

                        case JUMP:{
                            this.players[i].keys.jump = false;
                        }
                        break;

                        case CROUCH:{
                            this.players[i].keys.crouch = false;
                        }
                        break;
                    }

                    this.broadcast(JSON.stringify({e: 2, p: this.players[i].pid, k: message.k}), this.players[i].pid);

                    break;
                }
            }
        }
        break;

        // Receive coords
        case 3:{
            if (message.c && Array.isArray(message.c) && message.c.length == 3){
                inputform.startForm();
                var x = inputform.readNumber(message.c[0]);
                var y = inputform.readNumber(message.c[1]);
                var rot = inputform.readNumber(message.c[2]);
                if (inputform.hasErrors() == true){
                    return;
                }
                for(var i = 0; i < this.players.length; i++){
                    if (this.players[i].id == ws){
                        this.players[i].pos = [x, y, rot];
                        this.players[i].updated_coordinates = true;
                        break;
                    }
                }

            }
            
        }
        break;

        // Receive weapon rotation
        case 4:{
            inputform.startForm();
            inputform.readNumber(message.r);
            if (inputform.hasErrors() == true){
                return;
            }

            for (var i = 0; i < this.players.length; i++){
                if (this.players[i].id == ws){
                    this.players[i].pos[2] = message.r;
                    this.players[i].updated_coordinates = true;
                    break;
                }
            }
            
        }
        break;

        // Shoot weapon (this is just for visual feedback and won't actually register a hit on an enemy player.)
        case 5:{
            if (message.c && Array.isArray(message.c) && message.c.length == 3){
                inputform.startForm();
                var x = inputform.readNumber(message.c[0]);
                var y = inputform.readNumber(message.c[1]);
                var angle = inputform.readNumber(message.c[2], {min: 0, max: 360});
                if (inputform.hasErrors() == false){
                    var sender;
                    for (var i = 0; i < this.players.length; i++){
                        if (this.players[i].id == ws){
                            this.players[i].ammo -= 1;
                            if (this.players[i].ammo < 0){
                                this.players[i].ammo = 0;
                            }
                            sender = this.players[i].pid;
                            var bullet = JSON.stringify({e: 6, p: sender, c: [x, y, angle]});
                            this.broadcast(bullet, sender);
                            break;
                        }
                    }
                   
                }
            }
        }
        break;

        // Pick up weapon.
        case 6: {
            inputform.startForm();
            var pickupId = inputform.readNumber(message.i, {min: 0, max: 2000});
            if (inputform.hasErrors() == false){
                var sender;
                var sender_player;
                var origin_x = -1;
                var origin_y = -1;
                var weapon = 0;
                console.log("Complete");
                for(var i = 0; i < this.players.length; i++){
                    if (this.players[i].id == ws){
                        sender = this.players[i].pid;
                        sender_player = this.players[i];
                        origin_x = this.players[i].pos[0];
                        origin_y = this.players[i].pos[1];
                        weapon = this.players[i].weapon;
                        ammo = this.players[i].ammo;
                        ammo_reserve = this.players[i].ammo_reserve;
                        break;
                    }
                }

                var pickup = -1;

                for (var i = 0; i < this.weaponPickups.length; i++){
                    if (this.weaponPickups[i].id == pickupId){
                        pickup = this.weaponPickups[i];
                        break;
                    }
                }

                if (pickup != -1){
                    var newWeapon = pickup.weapon;
                    var newAmmo = pickup.ammo;
                    var newAmmoReserve = pickup.reserveAmmo;
                    if (weapon != 0){
                        this.createWeaponPickup(origin_x, origin_y - 64, weapon, ammo, ammo_reserve);
                    }
                    this.pickupWeapon(sender_player, newWeapon, newAmmo, newAmmoReserve);
                    this.destroyWeaponPickup(pickupId);
                }
            }
        }
        break;

        // Reload
        case 7:{
            for (var i = 0; i < this.players.length; i ++){
                if (this.players[i].id == ws){
                    inputform.startForm()
                    var time = inputform.readNumber(message.t, {min: 0, max: 100});
                    if (inputform.hasErrors() == false){
                        this.broadcast(JSON.stringify({e: 11, p: [this.players[i].pid, time]}), this.players[i].pid);
                    }
                    break;
                }
            }
        }
        break;

        // Complete reload
        case 8:{
            for (var i = 0; i < this.players.length; i ++){
                if (this.players[i].id == ws){
                    inputform.startForm()
                    var amount = inputform.readNumber(message.a, {min: 0, max: 100});
                    if (inputform.hasErrors() == false){
                        this.players[i].ammo += amount;
                        this.players[i].ammo_reserve -= amount;
                        if (this.players[i].ammo_reserve < 0){
                            this.players[i].ammo_reserve = 0;
                        }
                    }
                    break;
                }
            }
        }
        break;

        // Damage other player
        case 9:{
            inputform.startForm();
            var otherPly = inputform.readNumber(message.p);
            var x = inputform.readNumber(message.x);
            var y = inputform.readNumber(message.y);
            var damage = inputform.readNumber(message.d);
            if (inputform.hasErrors() == false){
                console.log("Dealing damage")
                var callingPlayer;
                var otherPlayer;
                var foundOther = false;
                var foundSelf = false;
                for (var i = 0; i < this.players.length; i++){
                    if (this.players[i].id == ws){
                        callingPlayer = this.players[i];
                        foundSelf = true;
                    }else{
                        if (this.players[i].pid == otherPly){
                            otherPlayer = this.players[i];
                            foundOther = true;
                        }
                    }
                    if (foundOther == true && foundSelf == true){
                        break;
                    }
                }

                if (foundOther == true && foundSelf == true){
                    //if (otherPlayer.team != callingPlayer.team){
                        // Re-add team check when game goes live
                        this.hurtPlayer(otherPlayer, damage, x, y, callingPlayer)
                    //}
                }

            }else{
                console.log("Damage packet has errors.");
            }
        }
        break;

        // Slug lunge
        case 10:{
            inputform.startForm();
            if (!message.c || !Array.isArray(message.c)){
                return;
            }
            var x = inputform.readNumber(message.c[0]);
            var y = inputform.readNumber(message.c[1]);
            var spd = inputform.readNumber(message.c[2]);
            if (inputform.hasErrors() == true){
                return;
            }
            for (var i = 0; i < this.players.length; i++){
                if (this.players[i].id == ws){
                    var msg = {e: 15, p: this.players[i].pid, c: [x, y, spd]}
                    this.broadcast(JSON.stringify(msg), this.players[i].pid);
                    break;
                }
            }
        }
        break;

        // Start game
        case 11:{
            if (this.gameState == WAITING){
                for(var i = 0; i < this.players.length; i++){
                    if (this.players[i].host == true){
                        this.startGame();
                        break;
                    }
                }
            }
        }
        break;

        // Spawn in
        case 12:{
            if (!message.c || !Array.isArray(message.c)){
                return;
            }
            inputform.startForm();
            var x = inputform.readNumber(message.c[0]);
            var y = inputform.readNumber(message.c[1]);
            var zombie_class = inputform.readNumber(message.z);

            if (inputform.hasErrors() == true){
                return;
            }else{
                console.log("Spawning in")
            }
            for(var i = 0; i < this.players.length; i++){
                if (this.players[i].id == ws){
                    this.spawnPlayer(this.players[i], x, y, zombie_class);
                    break;
                }
            }
        }
        break;
    }
}

Game.prototype.spawnPlayer = function(player, x, y, zombie_class){
    if (player.health > 0){
        console.log("Can't respawn with hp greater than 0")
        return;
    }

    if (!zombie_health[zombie_class]){
        console.log("Invalid zombie class")
        return;
    }

    player.zombie_class = zombie_class;
    if (player.team == TEAM_HUNTER){
        player.health = zombie_health[zombie_class];
    }else{
        player.health = 100;
    }
    player.pos = [x, y, 0];

    var msg = {e: 17, p: player.pid, c: player.pos, h: player.health, t: player.team, z: player.zombie_class}
    this.broadcast(JSON.stringify(msg), player.pid);
    player.id.send(JSON.stringify({e: 18, h: player.health, c: [player.pos[0], player.pos[1]], t: player.team, z: player.zombie_class}));
}

Game.prototype.destroyWeaponPickup = function(pickupId){
    for (var i = 0; i < this.weaponPickups.length; i++){
        if (this.weaponPickups[i].id == pickupId){
            
            this.weaponPickups.splice(i, 1);
            this.broadcast(JSON.stringify({
                e: 10,
                p: pickupId
            }))
            break;
        }
        
    }
    
}

Game.prototype.killPlayer = function(player){
    player.keys.left = false;
    player.keys.right = false;
    player.keys.jump = false;
    player.keys.crouch = false;
    player.health = 0;
    this.broadcast(JSON.stringify({e: 19, p: player.pid}), player.pid);
    player.id.send(JSON.stringify({e: 20}));
}

Game.prototype.setHost = function(newHostId){
    for(var i = 0; i < this.players.length; i++){
        if (this.players[i].pid == newHostId){
            this.players[i].host = true;
            this.players[i].id.send(JSON.stringify({e: 14}))
        }
    }
}

Game.prototype.hurtPlayer = function(player, damage, x, y, hurtingPlayer){
    console.log("Dealth " + damage + " points of damage to " + player.id.name + " from " + hurtingPlayer.id.name);
    player.health -= damage;
    if (player.health < 1){
        this.killPlayer(player);
    }else{
        if (hurtingPlayer){
            var msg = {e: 12, p: player.pid, d: damage, c: [x, y], a: hurtingPlayer.pid}
            this.broadcast(JSON.stringify(msg), player.pid, hurtingPlayer.pid);
            var targetMsg = {e: 13, c: [x, y], d: damage, a: hurtingPlayer.pid};
            console.log(targetMsg);
            player.id.send(JSON.stringify(targetMsg));
        }else{
            var msg = {e: 12, p: player.pid, d: damage};
            this.broadcast(JSON.stringify(msg), player.pid);
            var targetMsg = {e: 13, d: damage};
            console.log(targetMsg);
            player.id.send(JSON.stringify(targetMsg));
        }

        

    }
}

Game.prototype.createWeaponPickup = function(x, y, weapon, ammo, reserveAmmo){
    this.weaponPickups.push({id: this.pickupId, x: x, y: y, weapon: weapon, ammo: ammo, reserveAmmo: reserveAmmo});
    
    this.broadcast(JSON.stringify({
        e: 9,
        p: [this.pickupId, weapon, x, y]
    }))

    this.pickupId++;
}

Game.prototype.pickupWeapon = function(player, weapon, ammo, ammo_reserve){
    player.weapon = weapon;
    player.ammo = ammo;
    player.ammo_reserve = ammo_reserve;
    var pickedUp = JSON.stringify({
        e: 7,
        w: [player.pid, weapon]
    });
    this.broadcast(pickedUp, player.pid);
    var playerPickedUp = JSON.stringify({
        e: 8,
        w: [weapon, ammo, ammo_reserve]
    })
    player.id.send(playerPickedUp);
}

Game.prototype.removePlayer = function(ws){
    for (var i = 0; i < this.players.length; i++){
        if (this.players[i].id == ws){
            var name = this.players[i].id.name;
            var pid = this.players[i].pid;
            this.players.splice(i, 1);
            console.log(name + " disconnected.");
            this.broadcast(JSON.stringify({e: 4, p: pid}));
            if (this.players.length > 0){
                this.setHost(this.players[0].pid);
            }
            break;
        }
    }
}

Game.prototype.broadcast = function(message, exclude, exclude2){
    for (var i = 0; i < this.players.length; i++){
        if (this.players[i].pid != exclude && this.players[i].pid != exclude2){
            if (this.players[i].id && this.players[i].id.connected == true){
                this.players[i].id.send(message);
            }
        }
    }
}

Game.prototype.destroy = function(){
    clearInterval(this.tick);
}

module.exports = Game;