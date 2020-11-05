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

// select *, dbo.CalculateDistance(@lng, @lat, lng, lat) as distance from doctorUsers where distance < 30;

router.get('/:id', async function (req, res) {
    //validation needed - params.id

    let query = `SELECT *, (SELECT * FROM doctorDetails WHERE doctorUsers.id = doctorDetails.id FOR JSON PATH) AS detail, 
    (SELECT doctorSpecializations.* FROM doctorSpecializations WHERE doctorUsers.id = doctorSpecializations.id FOR JSON PATH) AS specialization FROM doctorUsers WHERE id = ${req.params.id};`;
    let params = [];

    doQuery(res, query, params, function (selectData) {
        if (empty(selectData.recordset)) return res.status(400).send({ error: "Doctor record does not exist." });

        delete selectData.recordset[0].pword;

        return res.status(200).send({ ...selectData.recordset.map(item => { let s = empty(JSON.parse(item.specialization)) ? {} : JSON.parse(item.specialization)[0]; delete item.specialization; return ({ ...item, detail: empty(JSON.parse(item.detail)) ? {} : JSON.parse(item.detail)[0], specializations: s }) })[0] });
    });

});

// GET Doctor's based on params

// insurance MAX premium = $1000 this or lower
// medical = bool 
// dental = bool
// vision = bool
// SELECT *
router.post('/', async function (req, res) {
    // validation needed - body - treatscovid, namesearch, speciality, name, address

    // covidonly will be 'Yes', 'No', or ''
    const covidOnly = req.body.treatscovid;
    const nameSearch = req.body.namesearch;
    const speciality = req.body.speciality;


    let params = [];

    if (empty(req.body.address)) {
        let query = `SELECT doctorUsers.id, doctorUsers.fname, doctorUsers.lname, doctorUsers.email, doctorUsers.phonenumber, 
        (SELECT * FROM doctorDetails WHERE doctorUsers.id = doctorDetails.id FOR JSON PATH) AS detail,
        (SELECT doctorSpecializations.* FROM doctorSpecializations WHERE doctorUsers.id = doctorSpecializations.id FOR JSON PATH) AS specialization
        FROM doctorUsers 
        INNER JOIN doctorDetails on doctorDetails.id = doctorUsers.id 
        INNER JOIN doctorSpecializations on doctorUsers.id = doctorSpecializations.id
        ${nameSearch ? `WHERE (doctorUsers.fname LIKE '%${req.body.name}%' OR doctorUsers.lname LIKE '%${req.body.name}%' OR CONCAT(doctorUsers.fname, ' ', doctorUsers.lname) = '${req.body.name}') ` : ''}
        ${!nameSearch ? `WHERE (doctorSpecializations.${speciality} = 1) ` : ''}
        ${empty(covidOnly) ? '' : `and doctorDetails.treatscovid = ${covidOnly === "Yes" ? 1 : 0}`};`;

        doQuery(res, query, params, function (selectData) {
            res.send(selectData.recordset.map(item => { let s = empty(JSON.parse(item.specialization)) ? {} : JSON.parse(item.specialization)[0]; delete item.specialization; return ({ ...item, detail: empty(JSON.parse(item.detail)) ? {} : JSON.parse(item.detail)[0], specializations: s }) }));
        });

    } else {
        geocoder.geocode(`${req.body.address}`)
            .then(function (result) {
                if (empty(result)) return res.status(400).send({ error: "Location not found." });
                let query = `SELECT doctorUsers.id, doctorUsers.fname, doctorUsers.lname, doctorUsers.email, doctorUsers.phonenumber, dbo.CalculateDistance(${result[0].longitude}, ${result[0].latitude}, doctorDetails.lng, doctorDetails.lat) as distance,
                (SELECT * FROM doctorDetails WHERE doctorUsers.id = doctorDetails.id FOR JSON PATH) AS detail,
                (SELECT doctorSpecializations.* FROM doctorSpecializations WHERE doctorUsers.id = doctorSpecializations.id FOR JSON PATH) AS specialization
                FROM doctorUsers 
                INNER JOIN doctorDetails on doctorDetails.id = doctorUsers.id 
                INNER JOIN doctorSpecializations on doctorUsers.id = doctorSpecializations.id
                ${nameSearch ? `WHERE (doctorUsers.fname LIKE '%${req.body.name}%' OR doctorUsers.lname LIKE '%${req.body.name}%' OR CONCAT(doctorUsers.fname, ' ', doctorUsers.lname) = '${req.body.name}') ` : ''}
                ${!nameSearch ? `WHERE (doctorSpecializations.${speciality} = 1) ` : ''}
                and dbo.CalculateDistance(${result[0].longitude}, ${result[0].latitude}, doctorDetails.lng, doctorDetails.lat) < 50
                ${empty(covidOnly) ? '' : `and doctorDetails.treatscovid = ${covidOnly === "Yes" ? 1 : 0}`};`;

                doQuery(res, query, params, function (selectData) {
                    res.send(selectData.recordset.map(item => { let s = empty(JSON.parse(item.specialization)) ? {} : JSON.parse(item.specialization)[0]; delete item.specialization; return ({ ...item, detail: empty(JSON.parse(item.detail)) ? {} : JSON.parse(item.detail)[0], specializations: s }) }));
                });
            })
            .catch(function (error) {
                return res.status(400).send({ error: "Location not found." });
            });
    }
});

module.exports = router;