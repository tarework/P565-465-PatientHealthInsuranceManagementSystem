const { doQuery, sql } = require('../db');
const { ValidatePassword, ValidateUpdateUser } = require('../models/user');
const { ValidatePatientMedicalData } = require('../models/puser');
const constants = require('../utils/constants');
//const mail = require('../utils/mail');
const storage = require('../utils/storage');
const bcrypt = require('bcryptjs');
const empty = require('is-empty');
//const moment = require('moment'),
const winston = require('winston');
const express = require('express');
const { route } = require('./password');
const router = express.Router();


// GET patientUser and patientMedicalData
router.get('/:id', async function (req, res) {
  let query = `SELECT *, (SELECT * FROM patientMedicalData WHERE patientUsers.id = patientMedicalData.id FOR JSON PATH) AS detail FROM patientUsers WHERE id = ${req.params.id};`;
  let params = [];

  doQuery(res, query, params, function (selectData) {
    if (empty(selectData.recordset)) return res.status(400).send({ error: "Patient record does not exist." })

    delete selectData.recordset[0].pword

    return res.status(200).send({ ...selectData.recordset.map(item => ({ ...item, detail: empty(JSON.parse(item.detail)) ? {} : JSON.parse(item.detail)[0] }))[0], usertype: 'patient' });
  });
});

//#region PUT patientUser/password/profilepic 

router.put('/user', async function (req, res) {
  // Data Validation
  const { error } = ValidateUpdateUser(req.body);
  if (error) return res.status(400).send({ error: error.message });

  // Make sure email isn't already registered in proper database table!!
  let query = `SELECT * FROM patientUsers WHERE email = @email and id <> @id;`;
  let params = [
    { name: 'email', sqltype: sql.VarChar(255), value: req.body.email },
    { name: 'id', sqltype: sql.Int, value: req.body.id }
  ];

  doQuery(res, query, params, async function (selectData) {
    let user = empty(selectData.recordset) ? [] : selectData.recordset[0];
    if (!empty(user)) return res.status(400).send({ error: `E-mail already registered.` });

    let query = `UPDATE patientUsers 
    SET email = @email, fname = @fname, lname = @lname, phonenumber = @phonenumber
    OUTPUT INSERTED.* 
    WHERE id = @id;`;
    let params = [
      { name: 'id', sqltype: sql.Int, value: req.body.id },
      { name: 'email', sqltype: sql.VarChar(255), value: req.body.email },
      { name: 'fname', sqltype: sql.VarChar(255), value: req.body.fname },
      { name: 'lname', sqltype: sql.VarChar(255), value: req.body.lname },
      { name: 'phonenumber', sqltype: sql.VarChar(50), value: req.body.phonenumber }
    ];

    doQuery(res, query, params, function (updateData) {
      if (empty(updateData.recordset)) return res.status(400).send({ error: "Data not saved." })

      delete updateData.recordset[0].pword

      return res.status(200).send(updateData.recordset[0]);
    });
  });
});

router.put('/password', async function (req, res) {
  // Data Validation
  const { error } = ValidatePassword(req.body);
  if (error) return res.status(400).send({ error: error.message });

  let query = `SELECT * FROM patientUsers WHERE id = ${req.body.id};`;
  let params = [];
  doQuery(res, query, params, async function (selectData) {
    if (empty(selectData.recordset)) return res.status(400).send({ error: "Patient record does not exist." })
    const user = selectData.recordset[0];

    // Check password is correct
    bcrypt.compare(req.body.pwordold, user.pword)
      .then(async (isMatch) => {
        if (!isMatch) return res.status(400).send({ error: `Incorrect old password.` });
      })
      .catch((error) => {
        winston.error("Password compare failure: " + error);
        return res.status(400).send({ error: `Incorrect old password.` });
      });

    // salt and hash new pword
    const salt = await bcrypt.genSalt(11);
    hashedPassword = await bcrypt.hash(req.body.pword, salt);

    // set new pword for user.id in dbs
    query = `UPDATE patientUsers 
    SET pword = @pword
    OUTPUT INSERTED.* 
    WHERE id = @id;`;
    params = [
      { name: 'id', sqltype: sql.Int, value: req.body.id },
      { name: 'pword', sqltype: sql.VarChar(255), value: hashedPassword }
    ];

    doQuery(res, query, params, async function (updateData) {
      if (empty(updateData.recordset)) return res.status(400).send({ error: "Data not saved." })

      delete updateData.recordset[0].pword

      return res.status(200).send({ user: updateData.recordset[0] });
    });
  });
});

router.put('/profilepic', async function (req, res) {
  // This method is in storage b/c
  // patients, doctors, and insurance users
  // can all do this.
  // Don't write it 3 times,
  // Extract it to a single location.
  return storage.UpdateProfilePic(req, res);
});

//#endregion

//#region POST/PUT patientMedicalData

// Creates patientMedicalData record for patientUser
router.post('/onboard', async function (req, res) {
  // Data Validation
  const { error } = ValidatePatientMedicalData(req.body);
  if (error) return res.status(400).send({ error: error.message });

  let query = `INSERT INTO patientMedicalData (id, address1, address2, state1, city, zipcode, birthdate, sex, height, weight1, bloodtype, smoke, smokefreq, drink, drinkfreq, caffeine, caffeinefreq) 
               OUTPUT INSERTED.* 
               VALUES (@id, @address1, @address2, @state1, @city, @zipcode, @birthdate, @sex, @height, @weight1, @bloodtype, @smoke, @smokefreq, @drink, @drinkfreq, @caffeine, @caffeinefreq);`;
  let params = [
    { name: 'id', sqltype: sql.Int, value: req.body.id },
    { name: 'address1', sqltype: sql.VarChar(255), value: req.body.address1 },
    { name: 'address2', sqltype: sql.VarChar(255), value: req.body.address2 },
    { name: 'state1', sqltype: sql.VarChar(15), value: req.body.state1 },
    { name: 'city', sqltype: sql.VarChar(50), value: req.body.city },
    { name: 'zipcode', sqltype: sql.VarChar(15), value: req.body.zipcode },
    { name: 'birthdate', sqltype: sql.VarChar(15), value: req.body.birthdate },
    { name: 'sex', sqltype: sql.VarChar(10), value: req.body.sex },
    { name: 'height', sqltype: sql.VarChar(10), value: req.body.height },
    { name: 'weight1', sqltype: sql.VarChar(10), value: req.body.weight1 },
    { name: 'bloodtype', sqltype: sql.VarChar(7), value: req.body.bloodtype },
    { name: 'smoke', sqltype: sql.Bit, value: req.body.smoke },
    { name: 'smokefreq', sqltype: sql.Int, value: req.body.smokefreq || 0 },
    { name: 'drink', sqltype: sql.Bit, value: req.body.drink },
    { name: 'drinkfreq', sqltype: sql.Int, value: req.body.drinkfreq || 0 },
    { name: 'caffeine', sqltype: sql.Bit, value: req.body.caffeine },
    { name: 'caffeinefreq', sqltype: sql.Int, value: req.body.caffeinefreq || 0 }
  ];

  doQuery(res, query, params, function (insertData) {
    if (empty(insertData.recordset)) return res.status(500).send({ error: "Data not saved." })

    return res.status(200).send({ detail: insertData.recordset[0] });
  });
});

// Updates patientMedicalData record for patientUser
router.put('/details', async function (req, res) {
  // Data Validation
  const { error } = ValidatePatientMedicalData(req.body);
  if (error) return res.status(400).send({ error: error.message });

  let query = `UPDATE patientMedicalData 
              SET address1 = @address1, address2 = @address2, state1 = @state1, city = @city, zipcode = @zipcode, birthdate = @birthdate, 
              sex = @sex, height = @height, weight1 = @weight1, bloodtype = @bloodtype, smoke = @smoke, smokefreq = @smokefreq, drink = @drink, 
              drinkfreq = @drinkfreq, caffeine = @caffeine, caffeinefreq = @caffeinefreq 
              OUTPUT INSERTED.* WHERE id = @id;`;
  let params = [
    { name: 'id', sqltype: sql.Int, value: req.body.id },
    { name: 'address1', sqltype: sql.VarChar(255), value: req.body.address1 },
    { name: 'address2', sqltype: sql.VarChar(255), value: req.body.address2 },
    { name: 'state1', sqltype: sql.VarChar(15), value: req.body.state1 },
    { name: 'city', sqltype: sql.VarChar(15), value: req.body.city },
    { name: 'zipcode', sqltype: sql.VarChar(15), value: req.body.zipcode },
    { name: 'birthdate', sqltype: sql.VarChar(15), value: req.body.birthdate },
    { name: 'sex', sqltype: sql.VarChar(10), value: req.body.sex },
    { name: 'height', sqltype: sql.VarChar(10), value: req.body.height },
    { name: 'weight1', sqltype: sql.VarChar(10), value: req.body.weight1 },
    { name: 'bloodtype', sqltype: sql.VarChar(7), value: req.body.bloodtype },
    { name: 'smoke', sqltype: sql.Bit, value: req.body.smoke },
    { name: 'smokefreq', sqltype: sql.Int, value: req.body.smokefreq || 0 },
    { name: 'drink', sqltype: sql.Bit, value: req.body.drink },
    { name: 'drinkfreq', sqltype: sql.Int, value: req.body.drinkfreq || 0 },
    { name: 'caffeine', sqltype: sql.Bit, value: req.body.caffeine },
    { name: 'caffeinefreq', sqltype: sql.Int, value: req.body.caffeinefreq || 0 }
  ];

  doQuery(res, query, params, function (updateData) {
    if (empty(updateData.recordset)) return res.status(500).send({ error: "Data not saved." })

    return res.status(200).send({ detail: updateData.recordset[0] });
  });
});

//#endregion

//#region GET Billing Details

// Gets patientUser bills sorted by paid/not paid then by date
router.get('/:id/mybills', async function (req, res) {
  let query = `SELECT * FROM patientBills WHERE id = @id;`;
  let params = [
    { name: 'id', sqltype: sql.Int, value: req.params.id }
  ];

  doQuery(res, query, params, function (selectData) {
    // No Bills? - This an acceptable scenario?
    if (empty(selectData.recordset)) return res.status(200).send({ bills: [] })

    const bills = selectData.recordset;
    // sorts if paid/not paid then by date
    const billsSortedByDate = bills.sort((a, b) => b.settled - a.settled || b.statementdate - a.statementdate);

    return res.status(200).send({ bills: billsSortedByDate });
  });
});

//#endregion

//#region GET Patient's Doctors

// Gets patientUser's doctors'
router.get('/:id/mydoctors', async function (req, res) {
  let query = `SELECT * FROM patientDoctorRelations WHERE pid = @pid;`;
  let params = [
    { name: 'pid', sqltype: sql.Int, value: req.params.id }
  ];
  doQuery(res, query, params, function (selectData) {
    if (empty(selectData.recordset)) return res.status(500).send({ error: "Failed to retrieve doctor records." });

    const didList = [];
    for (d = 0; d < selectData.recordset.length; d++) {
      didList.push(selectData.recordset[d].did);
    }
    let query = `SELECT email, fname, lname, phonenumber, 
      (SELECT address1, address2, state1, city, zipcode, npinumber, treatscovid, bedsmax,
        (SELECT * FROM doctorSpecializations WHERE doctorUsers.id = doctorSpecializations.id FOR JSON PATH) AS specializations
      FROM doctorDetails WHERE doctorUsers.id = doctorDetails.id FOR JSON PATH) AS detail 
      FROM doctorUsers WHERE id IN (${didList});`;
    params = [];
    doQuery(res, query, params, async function (selectData) {
      if (empty(selectData.recordset)) return res.status(500).send({ error: "Failed to retrieve doctor records." });

      return res.status(200).send({ ...selectData.recordset.map(item => ({ ...item, detail: empty(JSON.parse(item.detail)) ? {} : JSON.parse(item.detail) })) });
    });
  });
});

// Gets doctorUser's patient 
router.get('/:id/mydoctor/:did', async function (req, res) {
  let query = `SELECT * FROM patientDoctorRelations WHERE pid = @pid and did = @did;`;
  let params = [
    { name: 'pid', sqltype: sql.Int, value: req.params.id },
    { name: 'did', sqltype: sql.Int, value: req.params.did }

  ];
  doQuery(res, query, params, function (selectData) {
    if (empty(selectData.recordset)) return res.status(500).send({ error: "Failed to retrieve doctor records." });

    let query =
      `SELECT email, fname, lname, phonenumber, 
        (SELECT address1, address2, state1, city, zipcode, npinumber, treatscovid, bedsmax,
          (SELECT * 
          FROM doctorSpecializations WHERE doctorUsers.id = doctorSpecializations.id FOR JSON PATH) AS specializations
        FROM doctorDetails WHERE doctorUsers.id = doctorDetails.id FOR JSON PATH) AS detail,
        (SELECT patientname, doctorname, rating, reviewmessage
        FROM doctorReviews WHERE doctorUsers.id = doctorReviews.did FROM JSON PATH) AS reviews
      FROM doctorUsers WHERE id = (${req.params.did});`;
    params = [];
    doQuery(res, query, params, async function (selectData) {
      if (empty(selectData.recordset)) return res.status(500).send({ error: "Failed to retrieve doctor records." });

      return res.status(200).send({ ...selectData.recordset.map(item => ({ ...item, detail: empty(JSON.parse(item.detail)) ? {} : JSON.parse(item.detail) })) });
    });
  });
});

//#endregion

//#region GET Insurance Plans

router.get('/insuranceplans', async function (req, res) {

}); +

  //#endregion

  module.exports = router;