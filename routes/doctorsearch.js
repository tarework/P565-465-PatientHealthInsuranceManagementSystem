const { doQuery, sql } = require('../db');
// const { ValidatePassword, ValidateUpdateUser } = require('../models/user');
// const { ValidatePatientMedicalData } = require('../models/puser');
// const constants = require('../utils/constants');
// const mail = require('../utils/mail');
// const storage = require('../utils/storage');
// const bcrypt = require('bcryptjs');
const empty = require('is-empty');
// const moment = require('moment'),
const winston = require('winston');
const express = require('express');
const router = express.Router();

//select *, dbo.CalculateDistance(@lng, @lat, lng, lat) as distance from doctorUsers where distance < 30;

// GET Doctor's based on params
router.get('/', async function (req, res) {
    const covidOnly = req.body.covidonly;
    const nameSearch = req.body.namesearch;

    let query = '';
    let params = [];
    if (nameSearch) {
        query = `SELECT fname, lname, email, phonenumber, 
        (SELECT * FROM doctorDetails WHERE doctorUsers.id = doctorDetails.id FOR JSON PATH) AS detail
        FROM doctorUsers WHERE fname LIKE '%${req.body.name}%' OR lname LIKE '%${req.body.name}%'`;
    }
    else {
        query = `SELECT *,
        (SELECT fname, lname, email, phonenumber FROM doctorUsers WHERE doctorDetails.id = doctorUsers.id FOR JSON PATH) AS duser
        FROM doctorDetails WHERE address1 LIKE '%${req.body.address}%' OR address2 LIKE '%${req.body.address}%' OR city LIKE '%${req.body.address}%' OR state1 LIKE '%${req.body.address}%' OR zipcode LIKE '%${req.body.address}%'`;
    }

    doQuery(res, query, params, function (selectData) {
        if (empty(selectData.recordset)) return res.status(400).send({ error: "No doctors found." })

        let results = []

        if (nameSearch) {
            results = selectData.recordset.map(item => ({ ...item, detail: empty(JSON.parse(item.detail)) ? {} : JSON.parse(item.detail)[0] }));
        } else {
            results = selectData.recordset.map(rs => {
                const details = rs;
                const duser = rs["duser"];
                delete details.duser;
                rs = JSON.parse(duser);
                rs[0].detail = details;
                return rs[0];
            });
        }

        if (covidOnly) {
            results = results.filter(rs => { return rs["detail"]["treatscovid"] });
        }

        return res.status(200).send({ ...results /*, usertype: 'patient'*/ });
    });
});

module.exports = router;