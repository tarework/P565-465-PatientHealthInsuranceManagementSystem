require('dotenv').config();

const DB_PASS = process.env.DB_PASS;
const JWT_SECRET = process.env.JWT_SECRET;
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

module.exports = {
	DB_PASS, JWT_SECRET, GMAIL_PASSWORD, USER_TYPES, userTypeToTableName
}