const { doQuery, sql } = require('../db');
const { ValidateInsuranceSearch } = require('../models/insurancesearch');
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

// Slightly better query? Not really sure...
/*
SELECT insuranceUsers.id, insuranceUsers.fname, insuranceUsers.lname, insuranceUsers.email, insuranceUsers.phonenumber,
            (SELECT * FROM insuranceDetails 
                WHERE insuranceUsers.id = insuranceDetails.id 
                AND(insuranceDetails.companyname LIKE '%%') FOR JSON PATH) AS detail,
                (SELECT * FROM insurancePlans 
                    WHERE insuranceUsers.id = insurancePlans.id 
                    AND (insurancePlans.planname LIKE '%%')
                    AND insurancePlans.includesmedical = 1
                    AND insurancePlans.includesdental = 1
                    AND insurancePlans.includesvision = 1 FOR JSON PATH) AS plans
                FROM insuranceUsers
            INNER JOIN insuranceDetails on insuranceDetails.id = insuranceUsers.id
            INNER JOIN insurancePlans on insurancePlans.id = insuranceUsers.id
            WHERE
            (insuranceDetails.companyname LIKE '%%')
            AND (insurancePlans.planname LIKE '%%')
            AND insurancePlans.includesmedical = 1
            AND insurancePlans.includesdental = 1
            AND insurancePlans.includesvision = 1;
*/


// GET Insurances' based on params
router.post('/', async function (req, res) {
    // Feel free to change this.
    // companyname: Joi.string().required().allow("", null),
    // planname: Joi.string().required().allow("", null),
    // includesmedical: Joi.string().required().allow("", null),
    // includesdental: Joi.string().required().allow("", null),
    // includesvision: Joi.string().required().allow("", null),
    // Data Validation
    const { error } = ValidateInsuranceSearch(req.body);
    if (error) return res.status(400).send({ error: error.message });

    const companyname = req.body.companyname;
    const planname = req.body.planname;
    const includesmedical = req.body.includesmedical;
    const includesdental = req.body.includesdental;
    const includesvision = req.body.includesvision;
    const address = req.body.address;
    const params = [
        { name: 'companyname', sqltype: sql.VarChar, value: companyname },
        { name: 'planname', sqltype: sql.VarChar, value: planname },
        { name: 'includesmedical', sqltype: sql.Bit, value: includesmedical },
        { name: 'includesdental', sqltype: sql.Bit, value: includesdental },
        { name: 'includesvision', sqltype: sql.Bit, value: includesvision },
    ];


    if (empty(address)) {
        // This does not work!!
        let query = `SELECT insuranceUsers.id, insuranceUsers.fname, insuranceUsers.lname, insuranceUsers.email, insuranceUsers.phonenumber,
            (SELECT * FROM insuranceDetails WHERE insuranceUsers.id = insuranceDetails.id FOR JSON PATH) AS detail,
                (SELECT * FROM insurancePlans WHERE insuranceUsers.id = insurancePlans.id FOR JSON PATH) AS plans
                FROM insuranceUsers
            INNER JOIN insuranceDetails on insuranceDetails.id = insuranceUsers.id
            INNER JOIN insurancePlans on insurancePlans.id = insuranceUsers.id
            WHERE
            ${!empty(companyname) ? `(insuranceDetails.companyname LIKE '%${companyname}%')  AND ` : ''}
            ${!empty(planname) ? `(insurancePlans.planname LIKE '%${planname}%') AND` : ''}
            ${`insurancePlans.includesmedical = ${includesmedical === "Yes" ? 1 : 0}`}
            ${`AND insurancePlans.includesdental = ${includesdental === "Yes" ? 1 : 0}`}
            ${`AND insurancePlans.includesvision = ${includesvision === "Yes" ? 1 : 0}`};`;

        winston.info(query);

        doQuery(res, query, [], function (selectData) {
            return res.status(200).send(selectData.recordset);
            // This probably doesn't work either
            // return res.status(200).send(selectData.recordset.map(item => {
            //     let p = empty(JSON.parse(item.plan)) ? {} : JSON.parse(item.plan);
            //     delete item.plan;
            //     return ({ ...item, detail: empty(JSON.parse(item.detail)) ? {} : JSON.parse(item.detail)[0], plans: p })
            // }));
        });

    } else {
        geocoder.geocode(`${address} `)
            .then(function (result) {
                if (empty(result)) return res.status(400).send({ error: "Location not found." });
                // This does not work!!
                let query = `SELECT insuranceUsers.id, insuranceUsers.fname, insuranceUsers.lname, insuranceUsers.email, insuranceUsers.phonenumber,
                    (SELECT * FROM insuranceDetails WHERE insuranceUsers.id = insuranceDetails.id FOR JSON PATH) AS detail,
                        (SELECT * FROM insurancePlans WHERE insuranceUsers.id = insurancePlans.id FOR JSON PATH) AS plans
                        FROM insuranceUsers
                    INNER JOIN insuranceDetails on insuranceDetails.id = insuranceUsers.id
                    INNER JOIN insurancePlans on insurancePlans.id = insuranceUsers.id
                    WHERE
                    ${!empty(companyname) ? `(insuranceDetails.companyname LIKE '%${companyname}%')` : ''}
                    ${!empty(companyname) ? ` AND ` : ''}
                    ${!empty(planname) ? `(insurancePlans.planname LIKE '%${planname}%')` : ''}
                    ${!empty(companyname) || !empty(planname) ? `AND` : ''}
                    ${`insurancePlans.includesmedical = ${includesmedical === "Yes" ? 1 : 0}`}
                    ${`AND insurancePlans.includesdental = ${includesdental === "Yes" ? 1 : 0}`}
                    ${`AND insurancePlans.includesvision = ${includesvision === "Yes" ? 1 : 0}`}
                    and dbo.CalculateDistance(${result[0].longitude}, ${result[0].latitude}, insuranceDetails.lng, insuranceDetails.lat) < 50;`;

                doQuery(res, query, [], function (selectData) {
                    // This probably doesn't work either
                    return res.status(200).send(selectData.recordset);

                    // return res.status(200).send(selectData.recordset.map(item => {
                    //     let p = empty(JSON.parse(item.plan)) ? {} : JSON.parse(item.plan);
                    //     delete item.plan;
                    //     return ({ ...item, detail: empty(JSON.parse(item.detail)) ? {} : JSON.parse(item.detail)[0], plans: p })
                    // }));
                });
            })
            .catch(function (error) {
                return res.status(400).send({ error: "Location not found." });
            });
    }
});

module.exports = router;