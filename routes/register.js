// const auth = require('../middleware/auth')
const bcrypt = require('bcryptjs');
const _ = require('lodash');
const { generateAuthToken, validateUser } = require('../models/user')
// const mongoose = require('mongoose');
const constants = require('../utils/constants')
const express = require('express');
const { poolPromise, doQuery, sql } = require('../db');
const router = express.Router();

// Register New User
router.post('/', async (req, res) => {
    console.log('made it in register/post');
    // Validate information in request
    // is okay for registering a user.
    const { error } = validateUser(req.body);
    if(error) return res.status(400).send(`Bad Request: ${error.details[0].message}`);
    console.log('validated body');

    // Make sure email isn't already 
    // registered in proper database table!!
    let user = {};
    let query = `select * from ${constants.userTypeToTableName(req.body.userType)} u WHERE u.email == ${req.body.email};`;
    let params = [];
    doQuery(res, query, params, function(data) {
        user = data.recordset;
    });
    if (!user) return res.status(400).send(`Bad Request: E-mail already registered.`);
    console.log('email is unused');

    // Valid request parameters and available email.
    // Make the user object.
    user = {
         "email": req.body.email,
         "pword": req.body.password,
         "fName": req.body.fName,
         "lName": req.body.lName,
         "phoneNumber": req.body.phoneNumber
    };
    // Protect the password, salt and hash it!
    const salt = await bcrypt.genSalt(11);
    user.pword = await bcrypt.hash(user.pword, salt);
    console.log('salted and hashed pword');

    // Save new user to correct database table!
    query = `INSERT INTO ${constants.userTypeToTableName(req.body.userType)}`
    params = [
        // shouldn't ID be omitted since the SQL DB handles it?
        // { name: 'id', sqltype: sql.Int, value: 10 }, 
        { name: 'email', sqltype: sql.NVarChar, value: user.email },
        { name: 'pword', sqltype: sql.NVarChar, value: user.pword },
        { name: 'fName', sqltype: sql.NVarChar, value: user.fName },
        { name: 'lName', sqltype: sql.NVarChar, value: user.lName },
        { name: 'phoneNumber', sqltype: sql.NVarChar, value: user.phoneNumber }
    ];
    console.log('saved user to db');

    // Return authenication token and user object to front end.
    const token = generateAuthToken(user);
    res.header('x-auth-token', token).send(_.pick(user, ['_id', 'email', 'fName', 'lName', 'phoneNumber']));
});

module.exports = router;