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
const { geocoder } = require('../utils/geocoder');
const router = express.Router();

//select *, dbo.CalculateDistance(@lng, @lat, lng, lat) as distance from doctorUsers where distance < 30;

// GET Doctor's based on params
router.post('/', async function (req, res) {
    const covidOnly = req.body.treatscovid;
    const nameSearch = req.body.namesearch;
    const speciality = req.body.speciality;

    //covidonly will be 'Yes', 'No', or ''

    let params = [];

    if (empty(req.body.address)) {
        let query = `SELECT doctorUsers.fname, doctorUsers.lname, doctorUsers.email, doctorUsers.phonenumber, 
        (SELECT * FROM doctorDetails WHERE doctorUsers.id = doctorDetails.id FOR JSON PATH) AS detail
        FROM doctorUsers 
        INNER JOIN doctorDetails on doctorDetails.id = doctorUsers.id 
        INNER JOIN doctorSpecializations on doctorUsers.id = doctorSpecializations.id
        ${nameSearch ? `WHERE (doctorUsers.fname LIKE '%${req.body.name}%' OR doctorUsers.lname LIKE '%${req.body.name}%' OR CONCAT(doctorUsers.fname, ' ', doctorUsers.lname) = '${req.body.name}') ` : ''}
        ${!nameSearch ? `WHERE (doctorSpecializations.${speciality} = 1) ` : ''}
        ${empty(covidOnly) ? '' : `and doctorDetails.treatscovid = ${covidOnly === "Yes" ? 1 : 0}`};`;

        doQuery(res, query, params, function (selectData) {
            res.send(selectData.recordset.map(item => ({ ...item, detail: empty(JSON.parse(item.detail)) ? {} : JSON.parse(item.detail)[0] })));
        });

    } else {
        geocoder.geocode(`${req.body.address}`)
            .then(function (result) {
                if (empty(result)) return res.status(400).send({ error: "Location not found." });
                let query = `SELECT doctorUsers.fname, doctorUsers.lname, doctorUsers.email, doctorUsers.phonenumber, dbo.CalculateDistance(${result[0].longitude}, ${result[0].latitude}, doctorDetails.lng, doctorDetails.lat) as distance
            (SELECT * FROM doctorDetails WHERE doctorUsers.id = doctorDetails.id FOR JSON PATH) AS detail
            FROM doctorUsers 
            INNER JOIN doctorDetails on doctorDetails.id = doctorUsers.id 
            INNER JOIN doctorSpecializations on doctorUsers.id = doctorSpecializations.id
            ${nameSearch ? `WHERE (doctorUsers.fname LIKE '%${req.body.name}%' OR doctorUsers.lname LIKE '%${req.body.name}%' OR CONCAT(doctorUsers.fname, ' ', doctorUsers.lname) = '${req.body.name}') ` : ''}
            ${!nameSearch ? `WHERE (doctorSpecializations.${speciality} = 1) ` : ''}
            and distance < 50
            ${empty(covidOnly) ? '' : `and doctorDetails.treatscovid = ${covidOnly === "Yes" ? 1 : 0}`};`;

                doQuery(res, query, params, function (selectData) {
                    res.send(selectData.recordset.map(item => ({ ...item, detail: empty(JSON.parse(item.detail)) ? {} : JSON.parse(item.detail)[0] })));
                });
            })
            .catch(function (error) {
                return res.status(400).send({ error: "Location not found." });
            });
    }
});

module.exports = router;