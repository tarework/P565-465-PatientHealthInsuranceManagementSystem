const bcrypt = require('bcrypt');
const Joi = require('Joi');
const JoiPC = require('joi-password-complexity');
const { passwordOptions } = require('../models/user')
const express = require('express');
const router = express.Router();

// Logout User
// Frontend needs to delete local JW token

// Login User
router.post('/', async (req, res) => {
    // Validate information in request
    const { error } = validate(req.body);
    if(error) return res.status(400).send(`Bad Request: ${error.details[0].message}`);

    // Make sure email is already 
    // in proper database table!!
    let user = {};
    let query = `SELECT * FROM ${constants.userTypeToTableName(req.body.userType)} u WHERE u.email == ${req.body.email};`;
    let params = [];
    doQuery(res, query, params, function(data) {
        // TODO - this isn't working properly
        user = data.recordset;
    });
    // TODO - this isn't working properly
    if (!empty(user)) return res.status(400).send(`Bad Request: Invalid login credentials.`);

    // Check password is correct
    const validPassword = await bcrypt.compare(req.body.password, user.pword);
    if (!validPassword) return res.status(400).send(`Bad Request: Invalid login credentials.`);

    // Build user for auth token
    user = {
        "id": user['id'],
        //"email": req.body.email,
        //"pword": req.body.pword,
        //"fName": req.body.fName,
        //"lName": req.body.lName,
        //"phoneNumber": req.body.phoneNumber,
        "userType": req.body.userType,
    };

    // Return authenication token
    const token = user.generateAuthToken();
    res.send(token);
});

module.exports = router;