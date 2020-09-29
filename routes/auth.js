const bcrypt = require('bcrypt');
const Joi = require('Joi');
const JoiPC = require('joi-password-complexity');
const { User } = require('../models/loginuser')
const express = require('express');
const router = express.Router();

// JS Data Type To SQL Data Type Map
// String -> sql.NVarChar
// Number -> sql.Int
// Boolean -> sql.Bit
// Date -> sql.DateTime
// Buffer -> sql.VarBinary
// sql.Table -> sql.TVP

const passwordOptions = {
    min: 12,
    max: 255,
    lowerCase: 1,
    upperCase: 1,
    numeric: 1,
    symbol: 0,
    requirementCount: 4
}

// Logout User
// Frontend needs to delete local JW token

// Login User
router.post('/', async (req, res) => {
    const { error } = validate(req.body);
    if(error) return res.status(400).send(`Bad Request: ${error.details[0].message}`);

    let query = `select * from patientUsers p WHERE p.email == ${req.body.email};`;
    let params = [];
    let user = {};
    doQuery(res, query, params, function(data) {
        user = data.recordset;
    });

    if (!user) return res.status(400).send(`Bad Request: Invalid login credentials.`);

    const validPassword = await bcrypt.compare(req.body.password, user.pword);
    if (!validPassword) return res.status(400).send(`Bad Request: Invalid login credentials.`);

    const token = user.generateAuthToken();
    res.send(token);
});

function validate(request) {
    const schema = Joi.object({
        email: Joi.string().min(5).max(255).required().email(),
        password: JoiPC(passwordOptions)
    });

    return schema.validate(request);
}

module.exports = router;