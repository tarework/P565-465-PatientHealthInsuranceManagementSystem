let Joi = require('Joi');
Joi = Joi.extend(require('joi-phone-number'));
const JoiPC = require('joi-password-complexity');
const constants = require('../utils/constants');
const jwt = require('jsonwebtoken');

const passwordOptions = {
    min: 12,
    max: 255,
    lowerCase: 1,
    upperCase: 1,
    numeric: 1,
    symbol: 0,
    requirementCount: 4
};

function generateAuthToken(user){
    return jwt.sign({ _id: user._id, userType: user.userType }, constants.JWT_SECRET);
}

function validateUser(user) {
    const joiValidateSchema = Joi.object({
        email: Joi.string().min(5).max(255).required().email(),
        pword: JoiPC(passwordOptions),
        fName: Joi.string().min(1).max(255).required(),
        lName: Joi.string().min(1).max(255).required(),
        phoneNumber: Joi.string().phoneNumber({defaultCountry: 'US'}).required(),
    });

    return joiValidateSchema.validate(user);
}

module.exports.generateAuthToken = generateAuthToken;
module.exports.validateUser = validateUser;

// keeping for a bit until we get registration / login working

// function validateEmail(email) {
//     return Joi.object({
//         email: Joi.string().min(5).max(255).required().email(),
//     }).validate(email);
// }

// function validatePassword(password) {
//     return Joi.object({
//         password: JoiPC(passwordOptions)
//     }).validate(password);
// }

// class LoginUser {
    //     constructor() {
    //         this._id = null;
    //         this.email = null;
    //         this.password = null;
    //         this.userType = null;
    //     }
    
    //     initModel(data) {
    //         validateLoginUser(data);
    //         this._id = data._id;
    //         this.email = data.email;
    //         this.password = data.password;
    //         this.userType = data.userType;
    //     }
    
    //     getUserType() { return this.userType; }
    
    //     getEmail() { return this.email; }
    
    //     setEmail(email) { 
    //         validateEmail(email);
    //         this.email = email;
    //     }
    
    //     setPassword(password) {
    //         validatePassword(password);
    //         this.password = password;
    //     }
    // }

// Probably not needed
// class LoginUser {
//     constructor() {
//         this._id = null;
//         this.email = null;
//         this.password = null;
//         this.userType = null;
//     }

//     initModel(data) {
//         validateLoginUser(data);
//         this._id = data._id;
//         this.email = data.email;
//         this.password = data.password;
//         this.userType = data.userType;
//     }

//     getUserType() { return this.userType; }

//     getEmail() { return this.email; }

//     setEmail(email) { 
//         validateEmail(email);
//         this.email = email;
//     }

//     setPassword(password) {
//         validatePassword(password);
//         this.password = password;
//     }
// }