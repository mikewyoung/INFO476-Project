var inputs = [];
var activeInput = -1;

var dummyInput;
var canvas;

function createDummyInput(){
    dummyInput = document.createElement("INPUT");
    dummyInput.id = "dummyInput";
    //document.getElementsByTagName("body")[0].appendChild(dummyInput);
    canvas = document.getElementById("gm4html5_div_id");
    canvas.insertBefore(dummyInput, canvas.childNodes[0]);
    //canvas.appendChild(dummyInput);
    dummyInput.setAttribute("type", "text");
    dummyInput.setAttribute("style", "opacity:0.0000001;position:absolute;left:"+50+"%;top:"+50+"%;width:"+1+"px;height:"+1+"px;transform: translate(-50%, -50%);");
    dummyInput.onfocus = function(){
        dummyInput.setAttribute("style", "display: visible");
    }

    dummyInput.oninput = function(){
        inputs.forEach(function(input){
            if (input.name == activeInput){
                input.value = dummyInput.value;
            }
        });
    }

    /*dummyInput.on('keyup', function (e) {
        if (e.key === 'Enter' || e.keyCode === 13) {

            if (activeInput == "username"){
                selectInput("password");
            }else{
                gml_Script_gmcallback_switchFocus(-1, -1, false);
            }
        }
    });*/

    dummyInput.onblur = function(){
        dummyInput.setAttribute("style", "display: none");
        inputs.forEach(function(input){
            if (input.name == activeInput){
                input.value = dummyInput.value;
            }
        })
        activeInput = -1;
        canvas.focus();
        var event = new Event('onmousemove');
        canvas.dispatchEvent(event);
        gml_Script_gmcallback_switchFocus(-1, -1, true);
    }

}

function createInput(name, tabIndex, value){
    inputs.push({name: name, tabIndex: tabIndex, value: value});
}

function wipeInputs(){
    inputs.splice(0, inputs.length);
}

function selectInput(name){
    inputs.forEach(function(input){
        if (input.name == name){
            dummyInput.setAttribute("style", "display: visible");
            dummyInput.focus();
            dummyInput.value = input.value;
            activeInput = input.name;
            gml_Script_gmcallback_switchFocus(-1, -1, false);
            dummyInput.setAttribute("style", "position:absolute;left:"+50+"%;top:"+50+"%;width:"+1+"px;height:"+1+"px;transform: translate(-50%, -50%);")
        };
    });

}

function getSelectedInput(){
    return activeInput;
}

function removeInput(name){
    inputs.forEach(function(input){
        if (input.name == name){
            inputs.splice(inputs.indexOf(input), 1);
        }
    });
}

function getInputValue(name){
    var returnValue;
    inputs.forEach(function(input){
        if (input.name == name){
            returnValue = input.value;
        };
    });
    return returnValue || "";
}