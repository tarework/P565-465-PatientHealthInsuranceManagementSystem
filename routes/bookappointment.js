const { doQuery, sql } = require('../db');
const { ValidateBookAppointment } = require('../models/bookappointment');
// const { ValidatePatientMedicalData } = require('../models/puser');
// const constants = require('../utils/constants');
const { geocoder } = require('../utils/geocoder');
// const mail = require('../utils/mail');
// const storage = require('../utils/storage');
const bcrypt = require('bcryptjs');
const empty = require('is-empty');
const winston = require('winston');
const express = require('express');
const router = express.Router();

// GET Appointment
router.get('/', async function (req, res) {

    // let query = `SELECT *, (SELECT * FROM doctorDetails WHERE doctorUsers.id = doctorDetails.id FOR JSON PATH) AS detail, (SELECT doctorSpecializations.* FROM doctorSpecializations WHERE doctorUsers.id = doctorSpecializations.id FOR JSON PATH) AS specialization FROM doctorUsers WHERE id = ${req.params.id};`;
    // let params = [];

    // doQuery(res, query, params, function (selectData) {
    //     if (empty(selectData.recordset)) return res.status(400).send({ error: "Doctor record does not exist." });

    //     delete selectData.recordset[0].pword;

    //     return res.status(200).send({ ...selectData.recordset.map(item => { let s = empty(JSON.parse(item.specialization)) ? {} : JSON.parse(item.specialization)[0]; delete item.specialization; return ({ ...item, detail: empty(JSON.parse(item.detail)) ? {} : JSON.parse(item.detail)[0], specializations: s }) })[0] });
    // });

});

// CREATE Appointment
router.post('/', async function (req, res) {
    // Data Validation
    const { error } = ValidateBookAppointment(req.body);
    if (error) return res.status(400).send({ error: error.message });

    endtime = req.body.starttime + 30;

    // OUTPUT INSERTED.* - can't use this b/c of the insert trigger on appointments in DB.
    let query = `INSERT INTO appointments (did, pid, appointmentdate, starttime, endtime) 
    VALUES (@did, @pid, @appointmentdate, @starttime, @endtime);`;
    let params = [
        { name: 'did', sqltype: sql.Int, value: req.body.did },
        { name: 'pid', sqltype: sql.Int, value: req.body.pid },
        { name: 'appointmentdate', sqltype: sql.Date, value: req.body.appointmentdate },
        { name: 'starttime', sqltype: sql.Int, value: req.body.starttime },
        { name: 'endtime', sqltype: sql.Int, value: endtime }
    ];

    doQuery(res, query, params, function (insertData) {
        if (empty(insertData.recordset)) return res.status(400).send({ error: "Failed to create appointment." })

        // delete insertData.recordset[0].pword

        // TODO
        // CREATE DOCTOR PATIENT RELATIONSHIP
        // SEND CONFIRMATION TO DOCTOR AND TO PATIENT

        return res.status(200).send({ appointment: insertData.recordset });
    });
});

// UPDATE APPOINTMENT
router.post('/', async function (req, res) {
});

router.delete('/', async function (req, res) {

});

module.exports = router;