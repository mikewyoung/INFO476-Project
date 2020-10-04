// This library is used for, as you would expect, sanitized input forms.

var form = {
    // Must be called every time new input is being validated
    startForm: function(){
        this.formError = -1;
    },

    // Will read and validate a given number, whether the correct input is supplied, etc.
    // To add additional parameters, pass an object into the second argument with whatever args you want to supply.
    // PARAMETERS:
    // formError - Will change what form error code when a validation error occurs, the default being 0. This CANNOT be -1, as this is the code for no input error.
    // floor - Will floor the variable, without causing the form to give an error.
    // ceil - ditto, but will round the variable up
    // integer - same as the other two parameters, but will instead round the number to the closest integer.
    // min - Sets a min value for the input, without giving an error.
    // max - Sets a max value for the input, without giving an error.
    readNumber: function(int, params){
        if (this.formError != -1){
            return int;
        }

        params = params || {};

        if (typeof int != "number"){
            this.formError = params.errorCode || 0;
            return int;
        }

        if (params.floor && params.floor == true){
            int = Math.floor(int);   
        }

        if (params.ceil && params.ceil == true){
            int = Math.ceil(int);
        }

        if (params.integer && params.integer == true){
            int = Math.round(int);
        }

        if (params.min){
            if (int < params.min){
                int = params.min;
            }
        }

        if (params.max){
            if (int > params.max){
                int = params.max;
            }
        }

        return int;
    },

    // Will read and validate a given string, whether the correct input is supplied, etc.
    // To add additional parameters, pass an object into the second argument with whatever args you want to supply.
    // PARAMETERS:
    // formError - Will change what form error code when a validation error occurs, the default being 0. This CANNOT be -1, as this is the code for no input error.
    // maxLength - Self explanatory, will give an error if the input is longer than what is expected.
    // minLength - Ditto, but for minimum length.

    readString: function(str, params){
        if (this.formError != -1){
            return str;
        }

        params = params || {};

        if (typeof str != "string"){
            this.formError = params.errorCode || 0;
            return str;
        }

        if (params.maxLength && str.length > params.maxLength){
            this.formError == params.errorCode || 0;
            return str;
        }

        if (params.minLength && str.length < params.minLength){
            this.formError == params.errorCode || 0;
            return str;
        }

        return str;
    },

    hasErrors: function(){
        return (this.formError != -1);
    }
}

module.exports = form;