// const auth = require('../middleware/auth')
const bcrypt = require('bcrypt');
// const _ = require('lodash');
// const { User, validate } = require('../models/user')
// const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();

// Register New User
router.post('/', async (req, res) => {
    const { error } = validate(req.body);
    if(error) return res.status(400).send(`Bad Request: ${error.details[0].message}`);

    let user = {};
    let query = `select * from patientUsers p WHERE p.email == ${req.body.email};`;
    let params = [];
    doQuery(res, query, params, function(data) {
        user = data.recordset;
    });
    if (user) return res.status(400).send(`Bad Request: E-mail already registered.`);

    //user = new User(_.pick(req.body, ['name', 'email', 'password']));
    user = {
        "email": req.body.email,
        "pword": "",
        "fName": req.body.fName,
        "lName": req.body.lName
      };
    
    const salt = await bcrypt.genSalt(11);
    user.password = await bcrypt.hash(user.password, salt);
    
    //await user.save();

    // So new users dont have to login after registering
    // We don't want this in ApolloHealth
    // const token = jwt.sign({ _id: user._id }, config.get('jwtPrivateKey'));
    const token = user.generateAuthToken();
    res.header('x-auth-token', token).send(_.pick(user, ['_id', 'name', 'email']));
});