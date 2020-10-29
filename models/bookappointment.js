const Joi = require('joi');
const moment = require('moment');
const winston = require('winston');
const constants = require('../utils/constants');

function ValidateBookAppointment(request) {
    const schema = Joi.object({
        did: Joi.string().required(),
        pid: Joi.string().required(),
        appointmentdate: Joi.date().min(moment().format('MM-DD-YYYY')).required(),
        starttime: Joi.number().min(540).max(990).required().error(() => new Error('Start time is missing or invalid.'))
    }).options({ stripUnknown: true });

    return constants.CleanErrorMessage(schema.validate(request));
}

const NPINumber = (value, helpers) => {

    try {
        if (ValidateNPINumber(value))
            return value;
        else
            throw new Error('NPI Number is invalid. (Debug Message: Use 1234567893 as a acceptable value)');
    } catch (ex) {
        throw new Error('NPI Number is invalid. (Debug Message: Use 1234567893 as a acceptable value)');
    }
};

module.exports.ValidateBookAppointment = ValidateBookAppointment;