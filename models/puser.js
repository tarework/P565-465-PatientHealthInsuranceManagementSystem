const Joi = require('joi');
const winston = require('winston');
const constants = require('../utils/constants');

function ValidatePatientMedicalData(request) {

    winston.info(constants.regexWeight);
    const schema = Joi.object({
        address1: Joi.string().required(),
        address2: Joi.string().allow('', null),
        city: Joi.string().required().regex(constants.regexLettersOnly).error(() => new Error('City field is require and should contain only letters.')),
        state1: Joi.string().valid('AL', 'AK', 'AS', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FM', 'FL', 'GA', 'GU', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY',
            'LA', 'ME', 'MH', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'MP', 'OH', 'OK', 'OR', 'PW', 'PA', 'PR',
            'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VI', 'VA', 'WA', 'WV', 'WI', 'WY').required().error(() => new Error('State abbreviation is empty or invalid.')),
        zipcode: Joi.string().min(5).max(5).regex(constants.regexNumberOnly).required().error(() => new Error('Zipcode is required and must be 5 numbers.')),
        birthdate: Joi.date().max('now').min('1-1-1900').required(),
        sex: Joi.string().valid('Male', 'Female').required().error(() => new Error('Gender is empty or invalid.')),
        height: Joi.string().regex(constants.regexHeight).required().error(() => new Error('Height is empty or invalid.')),
        weight1: Joi.string().regex(constants.regexWeight).required().error(() => new Error('Weight is empty or invalid.')),
        bloodtype: Joi.string().valid('O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+', 'Unknown').required().error(() => new Error('Blood type is empty or invalid.')),
        smoke: Joi.boolean().required(),
        smokefreq: Joi.number().allow(null),
        drink: Joi.boolean().required(),
        drinkfreq: Joi.number().allow(null),
        caffeine: Joi.boolean().required(),
        caffeinefreq: Joi.number().allow(null)
    }).options({ stripUnknown: true });

    return constants.CleanErrorMessage(schema.validate(request));
}

module.exports.ValidatePatientMedicalData = ValidatePatientMedicalData;