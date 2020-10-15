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

function GenerateAuthToken(user) {
    return jwt.sign({ id: user.id, userType: user.userType }, constants.JWT_SECRET);
}

function DecodeAuthToken(token) {
    return jwt.decode(token);
}

function ValidateRegistration(request) {
    const schema = Joi.object({
        email: Joi.string().min(5).max(255).required().email(),
        pword: JoiPC(passwordOptions).required(),
        fName: Joi.string().min(2).max(255).required().regex(constants.regexLettersOnly),
        lName: Joi.string().min(2).max(255).required().regex(constants.regexLettersOnly),
        phoneNumber: Joi.string().required().regex(constants.regexPhoneNumber),
        userType: Joi.string().valid('patient', 'doctor', 'insurance').required()
    });

    return CleanErrorMessage(PruneUserTypeLingo(schema.validate(request)))
}

function ValidateLogin(request) {
    const schema = Joi.object({
        email: Joi.string().min(5).max(255).required().email(),
        pword: Joi.string().required(),
        userType: Joi.string().valid('patient', 'doctor', 'insurance').required()
    });

    return CleanErrorMessage(PruneUserTypeLingo(schema.validate(request)))
}

function ValidateEmail(request) {
    const schema = Joi.object({
        email: Joi.string().min(5).max(255).required().email(),
        userType: Joi.string().valid('patient', 'doctor', 'insurance').required()
    });

    return CleanErrorMessage(PruneUserTypeLingo(schema.validate(request)))
}

function ValidateDuoCode(request) {
    const schema = Joi.object({
        hashedDuoCode: Joi.string().required(),
        duo: Joi.string().required(),
        email: Joi.string().min(5).max(255).required().email(),
        userType: Joi.string().valid('patient', 'doctor', 'insurance').required()
    });
    
    return CleanErrorMessage(PruneUserTypeLingo(schema.validate(request)))
}

function ValidatePassword(request) {
    const schema = Joi.object({
        pword: JoiPC(passwordOptions).required(),
        pwordConfirmation: Joi.any().valid(Joi.ref('pword')).required().options({ language: { any: { allowOnly: 'must match password' } } })
    });

    return CleanErrorMessage(schema.validate(request));
}

function ValidateUpdateUser(request) {
    const schema = Joi.object({
        email: Joi.string().min(5).max(255).required().email(),
        fName: Joi.string().min(2).max(255).required().regex(constants.regexLettersOnly),
        lName: Joi.string().min(2).max(255).required().regex(constants.regexLettersOnly),
        phoneNumber: Joi.string().required().regex(constants.regexPhoneNumber),
    });

    return CleanErrorMessage(schema.validate(request));
}

function PruneUserTypeLingo(result) {
    if (result['error']) 
        if (result['error'].details[0].message.includes('userType'))
            result['error'].details[0].message = 'userType is invalid or empty';
    return result;
}

function CleanErrorMessage(result) {
    if (result['error'])
        result['error'].details[0].message = result['error'].details[0].message.replace(/\"/g, '')
    return result
}

module.exports.GenerateAuthToken = GenerateAuthToken;
module.exports.DecodeAuthToken = DecodeAuthToken;
module.exports.ValidateRegistration = ValidateRegistration;
module.exports.ValidateLogin = ValidateLogin;
module.exports.ValidateEmail = ValidateEmail;
module.exports.ValidateDuoCode = ValidateDuoCode;
module.exports.ValidatePassword = ValidatePassword;
module.exports.ValidateUpdateUser = ValidateUpdateUser;
module.exports.BuildUpdateUserSetString = BuildUpdateUserSetString;