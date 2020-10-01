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

function validateRegistration(user) {
    const joiValidateSchema = Joi.object({
        email: Joi.string().min(5).max(255).required().email(),
        pword: JoiPC(passwordOptions),
        fName: Joi.string().min(1).max(255).required(),
        lName: Joi.string().min(1).max(255).required(),
        phoneNumber: Joi.string().phoneNumber({defaultCountry: 'US'}).required(),
        userType: Joi.string().allow('patient', 'doctor', 'insuranceProvider')
    });

    return joiValidateSchema.validate(user);
}

function validateLogin(request) {
    const schema = Joi.object({
        email: Joi.string().min(5).max(255).required().email(),
        password: JoiPC(passwordOptions),
        userType: Joi.string().allow('patient', 'doctor', 'insuranceProvider')
    });

    return schema.validate(request);
}

module.exports.generateAuthToken = generateAuthToken;
module.exports.validateRegistration = validateRegistration;
module.exports.validateLogin = validateLogin;