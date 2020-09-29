const Joi = require('Joi');
const JoiPC = require('joi-password-complexity');

const userOptions = {
    PATIENT: 'patient', //puser
    DOCTOR: 'doctor', //duser
    INSURANCEPROVIDER: 'insuranceProvider', //ipuser
}

const passwordOptions = {
    min: 12,
    max: 255,
    lowerCase: 1,
    upperCase: 1,
    numeric: 1,
    symbol: 0,
    requirementCount: 4
};

class LoginUser {
    constructor() {
        this._id = null;
        this.email = null;
        this.password = null;
        this.userType = null;
    }

    initModel(data) {
        validateLoginUser(data);
        this._id = data._id;
        this.email = data.email;
        this.password = data.password;
        this.userType = data.userType;
    }

    getUserType() { return this.userType; }

    getEmail() { return this.email; }

    setEmail(email) { 
        validateEmail(email);
        this.email = email;
    }

    setPassword(password) {
        validatePassword(password);
        this.password = password;
    }

    // This needed? I suppose to to salt n hash in the DB?
    //getPassword() { return this.password; }

    // TODO - the comment below - implementation is from ETB's uDemy course
    // How can I get the jwtPrivate Key to replace ' config.get('jwtPrivateKey')';
    generateAuthToken() {
        return jwt.sign({ _id: this._id, userType: this.userType }, config.get('jwtPrivateKey'));
    }
}

function validateLoginUser(user) {
    return validateEmail(user.email) && validateLoginPassword(user.password);
}

function validateEmail(email) {
    return Joi.object({
        email: Joi.string().min(5).max(255).required().email(),
    }).validate(email);
}

function validatePassword(password) {
    return Joi.object({
        password: JoiPC(passwordOptions)
    }).validate(password);
}