//const winston = require('winston');
const bcrypt = require('bcryptjs');
const _ = require('lodash');
const empty = require('is-empty')
const { generateAuthToken, validateRegistration } = require('../models/user')
const constants = require('../utils/constants')
const { doQuery } = require('../db');
const express = require('express');
const router = express.Router();

// Register New User
router.post('/', async (req, res) => {
    // Validate information in request
    const { error } = validateRegistration(req.body);
    if(error) return res.status(400).send({error: `Bad Request: ${error.details[0].message}`});

    // Make sure email isn't already registered in proper database table!!
    let user = {};
    let query = `SELECT * FROM ${constants.userTypeToTableName(req.body.userType)} WHERE email='${req.body.email}';`;
    let params = [];
    doQuery(res, query, params, async function(selectData) {
        user = empty(selectData.recordset) ? [] : selectData.recordset[0];

        if (!empty(user)) {
            return res.status(400).send({error: `Bad Request: E-mail already registered.`});
        } else {
            // Protect the password, salt and hash it!
            const salt = await bcrypt.genSalt(11);
            user.pword = await bcrypt.hash(req.body.pword, salt);

            // Save new user to correct database table!
            // With INSERT statement output populates insertData.recordset[0] with data that was used in query
            // Can do INSERTED.* for all info or INSERTED.*columnName* for retrieving specific data
            // Can chain these like: OUTPUT INSERTED.id, INSERTED.email, INSERTED.phonenumber
            query = `INSERT INTO ${constants.userTypeToTableName(req.body.userType)} (email, pword, fname, lname, phonenumber)
            OUTPUT INSERTED.*
            VALUES ('${req.body.email}', '${user.pword}', '${req.body.fName}', '${req.body.lName}', '${req.body.phoneNumber}');`

            doQuery(res, query, params, function(insertData) { 
                user = empty(insertData.recordset) ? [] : insertData.recordset[0];

                if(empty(user)) {
                    res.status(500).send("Internal Server Error: Failed to register user.")
                } else {
                    // Build user for auth token
                    user = { "id": user['id'], "userType": req.body.userType };

                    // Return authenication token and created user object
                    const token = generateAuthToken(user);
                    res.send({token: token, id: user.id, userType: req.body.userType});
                }
            });
        }
    });
});

module.exports = router;