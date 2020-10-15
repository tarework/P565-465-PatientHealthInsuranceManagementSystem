require('dotenv').config();

const DB_PASS = process.env.DB_PASS;
const JWT_SECRET = process.env.JWT_SECRET;
const GMAIL_PASSWORD = process.env.GMAIL_PASSWORD;
const AZURE_STORAGE_KEY = process.env.AZURE_STORAGE_KEY;
const TOKEN_HEADER = 'Authorization';
const USER_TYPES = {
    PATIENT: 'patient', //puser
    DOCTOR: 'doctor', //duser
    INSURANCEPROVIDER: 'insurance', //ipuser
}

function UserTypeToTableName(userType){
    if(userType === USER_TYPES.PATIENT) return "patientUsers";
    else if(userType === USER_TYPES.DOCTOR) return "doctorUsers";
    else if(userType === USER_TYPES.INSURANCEPROVIDER) return "insuranceUsers";
    else return "ERROR";
}

function CleanErrorMessage(result) {
    if (result['error'])
        result['error'].details[0].message = result['error'].details[0].message.replace(/\"/g, '')
    return result
}

// Regex Functions
// Test at regex101.com

const regexLettersOnly = new RegExp('^[a-zA-Z]{2,}$');
const regexPhoneNumber = new RegExp('^\\s*(?:\\+?(\\d{1,3}))?[-. (]*(\\d{3})[-. )]*(\\d{3})[-. ]*(\\d{4})(?: *x(\\d+))?\\s*$');
const yyyymmddRegex = new RegExp('^\d{4}\/(0?[1-9]|1[012])\/(0?[1-9]|[12][0-9]|3[01])$'); // Example 1990/7/23" limits months to 1-12 and days 1-31
const heightRegex = new RegExp(`^[3-7] (?:\s*(?:1[01]|[0-9])(''|"))?$`); // Example 5 8"

module.exports = {
    DB_PASS, JWT_SECRET, TOKEN_HEADER, GMAIL_PASSWORD, AZURE_STORAGE_KEY, USER_TYPES, 
    UserTypeToTableName, CleanErrorMessage, 
    regexLettersOnly, regexPhoneNumber, yyyymmddRegex, heightRegex
}