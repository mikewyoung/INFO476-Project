// Open the long message
function openLogin(){
    var modal = document.getElementById("login");
    modal.setAttribute("style", "display: flex");
    gml_Script_gmcallback_switchFocus(-1, -1, false);
    var header = document.getElementById("login-header");
    header.innerHTML = "Welcome back, adventurer.";
    header.setAttribute("style", "color: rgb(255, 255, 255)");
}

// Does the login 
function login(){
    var username = document.getElementById("username").value;
    var password = document.getElementById("password").value;
    gml_Script_gmcallback_sendLogin(-1, -1, username, password);

    var modal = document.getElementById("login");
    modal.setAttribute("style", "display: none");
}

// Closes the login screen
function closeLogin(){
    var modal = document.getElementById("login");
    modal.setAttribute("style", "display: none"); 
    gml_Script_gmcallback_switchFocus(-1, -1, true);
}

function openLoginMessage(message, colorString){
    var modal = document.getElementById("login");
    modal.setAttribute("style", "display: flex");
    gml_Script_gmcallback_switchFocus(-1, -1, false);
    var header = document.getElementById("login-header");
    header.innerHTML = message;
    header.setAttribute("style", "color: " + colorString);
}