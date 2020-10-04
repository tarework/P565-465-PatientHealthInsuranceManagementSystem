require('dotenv').config();

const DB_PASS = process.env.DB_PASS;
const JWT_SECRET = 'MyLittleSecret';//process.env.JWT_SECRET;
const TOKEN_HEADER = 'x-auth-token';
const GMAIL_PASSWORD = process.env.GMAIL_PASSWORD;
const USER_TYPES = {
    PATIENT: 'patient', //puser
    DOCTOR: 'doctor', //duser
    INSURANCEPROVIDER: 'insuranceProvider', //ipuser
}

function userTypeToTableName(userType){
    if(userType == USER_TYPES.PATIENT) return "patientUsers";
    else if(userType == USER_TYPES.PATIENT) return "doctorUsers";
    else if(userType == USER_TYPES.PATIENT) return "insuranceProviderUsers";
    else return "ERROR";
}

// Regex Functions
// Test at regex101.com

const regexLettersOnly = new RegExp('^[a-zA-Z]{2,}$');
const regexPhoneNumber = new RegExp('^\\s*(?:\\+?(\\d{1,3}))?[-. (]*(\\d{3})[-. )]*(\\d{3})[-. ]*(\\d{4})(?: *x(\\d+))?\\s*$');

module.exports = {
	DB_PASS, JWT_SECRET, TOKEN_HEADER, GMAIL_PASSWORD, USER_TYPES, userTypeToTableName, regexLettersOnly, regexPhoneNumber
}