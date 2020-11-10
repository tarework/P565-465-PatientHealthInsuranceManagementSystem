const { doQuery, sql } = require('../db');
const { ValidateCovidSurvey, } = require('../models/covidsurvey');
const bcrypt = require('bcryptjs');
const empty = require('is-empty');
const winston = require('winston');
const express = require('express');
const router = express.Router();

// Create or update patient covid survey
router.post('/', async function (req, res) {
    // Data Validation
    const { error } = ValidateCovidSurvey(req.body);
    if (error) return res.status(400).send({ error: error.message });

    let query = "SELECT * FROM patientCovidSurvey WHERE id = @id;";
    let params = [
        { name: 'id', sqltype: sql.Int, value: req.body.id }
    ];

    doQuery(res, query, params, function (selectData) {
        params = [
            { name: 'id', sqltype: sql.Int, value: req.body.id },
            { name: 'surveydate', sqltype: sql.Date, value: req.body.surveydate },
            { name: 'feverorchills', sqltype: sql.bit, value: req.body.feverorchills },
            { name: 'cough', sqltype: sql.bit, value: req.body.cough },
            { name: 'shortnessofbreathe', sqltype: sql.bit, value: req.body.shortnessofbreathe },
            { name: 'fatigue', sqltype: sql.bit, value: req.body.fatigue },
            { name: 'muscleaches', sqltype: sql.bit, value: req.body.muscleaches },
            { name: 'headache', sqltype: sql.bit, value: req.body.headache },
            { name: 'lossofsmelltaste', sqltype: sql.bit, value: req.body.lossofsmelltaste },
            { name: 'sorethroat', sqltype: sql.bit, value: req.body.sorethroat },
            { name: 'congestion', sqltype: sql.bit, value: req.body.congestion },
            { name: 'nauseaorvomiting', sqltype: sql.bit, value: req.body.nauseaorvomiting },
            { name: 'diarrhea', sqltype: sql.bit, value: req.body.diarrhea },
            { name: 'contactwithcovidperson', sqltype: sql.bit, value: req.body.contactwithcovidperson },
            { name: 'covidpositivetest', sqltype: sql.bit, value: req.body.covidpositivetest },
            { name: 'selfmonitor', sqltype: sql.bit, value: req.body.selfmonitor },
            { name: 'requesttest', sqltype: sql.bit, value: req.body.selfmonitor }
        ];

        // Create it
        if (empty(selectData.recordset)) {
            query = `INSERT INTO patientCovidSurvey (id, surveydate, feverorchills, cough, shortnessofbreathe, fatigue, muscleaches, headache,
                lossofsmelltaste, sorethroat, congestion, nauseaorvomiting, diarrhea, contactwithcovidperson, covidpositivetest, selfmonitor, requesttest)  
                OUTPUT INSERTED.* 
                VALUES (@id, @surveydate, @feverorchills, @cough, @shortnessofbreathe, @fatigue, @muscleaches, @headache,
                @lossofsmelltaste, @sorethroat, @congestion, @nauseaorvomiting, @diarrhea, @contactwithcovidperson, @covidpositivetest, @selfmonitor, @requesttest);`;
            doQuery(res, query, params, function (insertData) {
                if (empty(selectData.recordset)) return res.status(500).send({ error: "Data failed to save." });

                return res.status(200).send({ ...selectData[0] })
            });
        }
        // Update it
        else {
            query = `UPDATE patientCovidSurvey 
            SET surveydate = @surveydate, feverorchills = @feverorchills, cough = @cough, shortnessofbreathe = @shortnessofbreathe
            fatigue = @fatigue, muscleaches = @muscleaches, headache = @headache, lossofsmelltaste = @lossofsmelltaste
            sorethroat = @sorethroat, congestion = @congestion, nauseaorvomiting = @nauseaorvomiting, diarrhea = @diarrhea
            contactwithcovidperson = @contactwithcovidperson, covidpositivetest = @covidpositivetest, selfmonitor = @selfmonitor, requesttest = @requesttest
            OUTPUT INSERTED.* 
            WHERE id = @id;`;
            doQuery(res, query, params, function (updateData) {
                if (empty(selectData.recordset)) return res.status(500).send({ error: "Data failed to update." });

                return res.status(200).send({ ...selectData[0] })
            });
        }
    });
});