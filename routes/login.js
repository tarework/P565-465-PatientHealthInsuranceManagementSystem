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
    if(error) return res.status(400).send({error: `Bad Request: ${error.details[0].message}`});

    // Make sure email is already 
    // in proper database table!!
    let query = `SELECT * FROM ${constants.userTypeToTableName(req.body.userType)} WHERE email='${req.body.email}';`;
    let params = [];
    doQuery(res, query, params, async function(data) {
        const user = empty(data.recordset) ? {} : data.recordset[0];

        if (empty(user)) {
            return res.status(400).send({error: `Bad Request: Invalid login credentials.`});
        } else {
            // Check password is correct
            await bcrypt.compare(req.body.pword, user.pword).then(isMatch => {
                if (!isMatch) {
                    return res.status(400).send({error: `Bad Request: Invalid login credentials.`});
                } else {

                    // Return authenication token
                    const token = generateAuthToken({
                        "id": user['id'],
                        "userType": req.body.userType,
                    });
                    res.send({token: token});
                }
            });
            
        }
    });
    
});

module.exports = router;