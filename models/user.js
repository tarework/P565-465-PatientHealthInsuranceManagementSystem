const Joi = require('joi');
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
    return jwt.sign({ id: user.id, userType: user.userType }, constants.JWT_SECRET);
}

function validateRegistration(request) {
    const schema = Joi.object({
        email: Joi.string().min(5).max(255).required().email(),
        pword: JoiPC(passwordOptions).required(),
        fName: Joi.string().min(2).max(255).required().regex(constants.regexLettersOnly),
        lName: Joi.string().min(2).max(255).required().regex(constants.regexLettersOnly),
        phoneNumber: Joi.string().required().regex(constants.regexPhoneNumber),
        userType: Joi.string().valid('patient', 'doctor', 'insurance').required()
    });

    return schema.validate(request);
}

function validateLogin(request) {
    const schema = Joi.object({
        email: Joi.string().min(5).max(255).required().email(),
        pword: Joi.string().required(),
        userType: Joi.string().valid('patient', 'doctor', 'insurance').required()
    });

    return schema.validate(request);
}

function validateEmail(request) {
    const schema = Joi.object({
        email: Joi.string().min(5).max(255).required().email(),
        userType: Joi.string().valid('patient', 'doctor', 'insurance').required()
    });

    return schema.validate(request);
}

function validateDuoCode(request) {
    const schema = Joi.object({
        hashedDuo: Joi.string().required(),
        duo: Joi.string().required(),
        email: Joi.string().min(5).max(255).required().email(),
        userType: Joi.string().valid('patient', 'doctor', 'insurance').required()
    });
    
    return schema.validate(request);
}

module.exports.generateAuthToken = generateAuthToken;
module.exports.validateRegistration = validateRegistration;
module.exports.validateLogin = validateLogin;
module.exports.validateEmail = validateEmail;
module.exports.validateDuoCode = validateDuoCode;