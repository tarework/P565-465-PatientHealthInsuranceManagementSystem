const bcrypt = require('bcrypt');
const empty = require('is-empty');
const { generateAuthToken, validateLogin } = require('../models/user');
const constants = require('../utils/constants');
const { doQuery } = require('../db');
const winston = require('winston');
const express = require('express');
const router = express.Router();

// Logout User
// Frontend needs to delete local JW token

// Login User
router.post('/', async (req, res) => {
    // Validate information in request
    const { error } = validateLogin(req.body);
    if(error) return res.status(400).send(`Bad Request: ${error.details[0].message}`);

    // Make sure email is already 
    // in proper database table!!

    let user = {};
    let query = `SELECT * FROM ${constants.userTypeToTableName(req.body.userType)} WHERE email='${req.body.email}';`;
    let params = [];
    winston.info(query);
    doQuery(res, query, params, async function(data) {
        user = empty(data.recordset) ? [] : data.recordset[0];
        
        winston.info(user['id']);
        winston.info(user['email']);
        winston.info(user['pword']);
        winston.info(user['lName']);
        winston.info(user['fName']);
        winston.info(user['phoneNumber']);

        if (empty(user)) {
            return res.status(400).send(`Bad Request: Invalid login credentials.`);
        } else {
            // Check password is correct
            const validPassword = await bcrypt.compare(req.body.pword, user.pword);
            if (!validPassword) return res.status(400).send(`Bad Request: Invalid login credentials.`);

            // Build user for auth token
            user = {
                "id": user['id'],
                "userType": req.body.userType,
            };

            // Return authenication token
            const token = generateAuthToken(user);
            res.send(token);
        }
    });
    
});

module.exports = router;