var Server;
var charData;

function connectServer(url, token){
    
    Server = new WebSocket("ws://" + url + "/game?"+token);
    
    Server.onopen = function(){
        console.log("Connected to server successfully");
    }

    Server.onclose = function(event){
        console.log("Disconnected from server.");
        gml_Script_gmcallback_disconnected(-1, -1, 0);
    }

    Server.onerror = function(event){
        console.log("Error connecting to server");
        gml_Script_gmcallback_disconnected(-1, -1, 0);
    }

    // Do stuff with the user messages
    Server.onmessage = function(event){
        console.log(event.data);
        var msg = JSON.parse(event.data);

        switch(msg.e){
            // Initial login
            case 0:{
                gml_Script_gmcallback_connected(-1, -1);
                charData = msg.d;
            }
            break;
        }
    }
}