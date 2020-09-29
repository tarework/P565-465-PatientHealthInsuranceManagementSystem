const Joi = require('Joi');
const LoginUser = require('../models/loginuser');
// const JoiPC = require('joi-password-complexity');

// const passwordOptions = {
//     min: 12,
//     max: 255,
//     lowerCase: 1,
//     upperCase: 1,
//     numeric: 1,
//     symbol: 0,
//     requirementCount: 4
// };

class Puser extends LoginUser {
    constructor() {
        this.firstname = null;
        this.middlename = null;
        this.lastname = null;
        this.birthdate = null;
        this.assignedDoctor = null;
        this.weight = null;
        this.height = null;
        this.bloodType = null;
    }

    InitModel(data) {
        super.InitModel(data);
        this.firstname = data.firstname;
        this.middlename = data.middlename;
        this.lastname = data.lastname;
        this.birthdate = data.birthdate;
        this.assignedDoctor = data.assignedDoctor;
        this.weight = data.weight;
        this.height = data.height;
        this.bloodType = data.bloodType;
    }
}