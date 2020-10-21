const { doQuery, sql } = require('../db');
const { ValidatePassword, ValidateUpdateUser } = require('../models/user');
const { ValidateDoctorDetails } = require('../models/duser');
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


// GET doctorUser and doctorDetails
router.get('/:id', async function (req, res) {

  let query = `SELECT *, (SELECT * FROM doctorDetails WHERE doctorUsers.id = doctorDetails.id FOR JSON PATH) AS detail FROM doctorUsers WHERE id = ${req.params.id};`;
  let params = [];

  doQuery(res, query, params, function (selectData) {
    if (empty(selectData.recordset)) return res.status(400).send({ error: "Doctor record does not exist." })

    delete selectData.recordset[0].pword

    return res.status(200).send({ ...selectData.recordset.map(item => ({ ...item, detail: empty(JSON.parse(item.detail)) ? {} : JSON.parse(item.detail)[0] }))[0], userType: 'doctor' });
  });
});

//#region PUT doctorUser/password/profilepic 

router.put('/user', async function (req, res) {
  // Data Validation
  const { error } = ValidateUpdateUser(req.body);
  if (error) return res.status(400).send({ error: error.message });

  // Make sure email isn't already registered in proper database table!!
  let query = `SELECT * FROM doctorUsers WHERE email = @email AND id <> @id;`;
  let params = [
    { name: 'email', sqltype: sql.VarChar(255), value: req.body.email },
    { name: 'id', sqltype: sql.Int, value: req.body.id }
  ];

  doQuery(res, query, params, async function (selectData) {
    let user = empty(selectData.recordset) ? [] : selectData.recordset[0];
    if (!empty(user)) return res.status(400).send({ error: `E-mail already registered.` });

    let query = `UPDATE doctorUsers 
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

  // Grab user
  let query = `SELECT * FROM doctorUsers WHERE id = ${req.body.id};`;
  let params = [];
  doQuery(res, query, params, async function (selectData) {
    if (empty(selectData.recordset)) return res.status(400).send({ error: "Doctor record does not exist." })
    const user = selectData.recordset[0];

    // Check password is correct
    bcrypt.compare(req.body.pwordOld, user.pword)
      .then(async (isMatch) => {
        if (!isMatch) return res.status(400).send({ error: `Incorrect old password.` });
      })
      .catch((error) => {
        winston.error("Password compare failure: " + error);
        return res.status(400).send({ error: `ncorrect old password.` });
      });

    // salt and hash new pword
    const salt = await bcrypt.genSalt(11);
    hashedPassword = await bcrypt.hash(req.body.pword, salt);

    // set new pword for user.id in dbs
    query = `UPDATE doctorUsers 
    SET pword = @pword
    OUTPUT INSERTED.* 
    WHERE id = @id;`;
    params = [
      { name: 'id', sqltype: sql.Int, value: req.body.id },
      { name: 'pword', sqltype: sql.VarChar(255), value: hashedPassword }
    ];

    doQuery(res, query, params, async function (updateData) {
      if (empty(updateData.recordset)) return res.status(500).send({ error: "Data not saved." })

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

//#region POST/PUT doctorDetails

// Creates doctorDetails record for doctorUser
router.post('/onboard', async function (req, res) {
  // Data Validation
  const { error } = ValidateDoctorDetails(req.body);
  if (error) return res.status(400).send({ error: error.message });

  let query = `INSERT INTO doctorDetails (id, practicename, address1, address2, city, state1, zipcode,
              npinumber, specializations, treatscovid, bedsavilable, bedsmax) 
              OUTPUT INSERTED.* 
              VALUES (@id, @address1, @address2, @city, @state1, @zipcode, 
              @npinumber, @specializations, @treatscovid, @bedsavilable, @bedsmax);`;
  let params = [
    { name: 'id', sqltype: sql.Int, value: req.body.id },
    { name: 'practicename', sqltype: sql.VarChar(255), value: req.body.practicename },
    { name: 'address1', sqltype: sql.VarChar(255), value: req.body.address1 },
    { name: 'address2', sqltype: sql.VarChar(255), value: req.body.address2 },
    { name: 'city', sqltype: sql.VarChar(50), value: req.body.city },
    { name: 'state1', sqltype: sql.VarChar(15), value: req.body.state1 },
    { name: 'zipcode', sqltype: sql.VarChar(15), value: req.body.zipcode },
    { name: 'npinumber', sqltype: sql.VarChar(10), value: req.body.npinumber },
    { name: 'specializations', sqltype: sql.VarChar(255), value: req.body.specializations },
    { name: 'treatscovid', sqltype: sql.Bit, value: req.body.treatscovid },
    { name: 'bedsavailable', sqltype: sql.Int, value: req.body.bedsavailable },
    { name: 'bedsmax', sqltype: sql.Int, value: req.body.bedsmax }
  ];

  doQuery(res, query, params, function (insertData) {
    if (empty(insertData.recordset)) return res.status(500).send({ error: "Data not saved." })

    return res.status(200).send({ detail: insertData.recordset[0] });
  });
});

// Updates doctorDetails record for doctorUser
router.put('/details', async function (req, res) {
  // Data Validation
  const { error } = ValidatePatientMedicalData(req.body);
  if (error) return res.status(400).send({ error: error.message });

  let query = `INSERT INTO doctorDetails (id, practicename, address1, address2, city, state1, zipcode,
    npinumber, specializations, treatscovid, bedsavilable, bedsmax) 
    OUTPUT INSERTED.* 
    VALUES (@id, @address1, @address2, @city, @state1, @zipcode, 
    @npinumber, @specializations, @treatscovid, @bedsavilable, @bedsmax);`;
  let params = [
    { name: 'id', sqltype: sql.Int, value: req.body.id },
    { name: 'practicename', sqltype: sql.VarChar(255), value: req.body.practicename },
    { name: 'address1', sqltype: sql.VarChar(255), value: req.body.address1 },
    { name: 'address2', sqltype: sql.VarChar(255), value: req.body.address2 },
    { name: 'city', sqltype: sql.VarChar(50), value: req.body.city },
    { name: 'state1', sqltype: sql.VarChar(15), value: req.body.state1 },
    { name: 'zipcode', sqltype: sql.VarChar(15), value: req.body.zipcode },
    { name: 'npinumber', sqltype: sql.VarChar(10), value: req.body.npinumber },
    { name: 'specializations', sqltype: sql.VarChar(255), value: req.body.specializations },
    { name: 'treatscovid', sqltype: sql.Bit, value: req.body.treatscovid },
    { name: 'bedsavailable', sqltype: sql.Int, value: req.body.bedsavailable },
    { name: 'bedsmax', sqltype: sql.Int, value: req.body.bedsmax }
  ];

  doQuery(res, query, params, function (updateData) {
    if (empty(updateData.recordset)) return res.status(500).send({ error: "Data not saved." })

    return res.status(200).send({ detail: updateData.recordset[0] });
  });
});

//#endregion

//#region GET Billing Details

// Gets doctorUser's patient's sorted by name.
router.get('/:id/mypatients', async function (req, res) {

  // come back after validation for doctorDetails is done

  // let query = `SELECT * FROM patientBills WHERE id = @id;`;
  // let params = [
  //   { name: 'id', sqltype: sql.Int, value: req.params.id }
  // ];

  // doQuery(res, query, params, function (selectData) {
  //   // No Bills? - This an acceptable scenario?
  //   if (empty(selectData.recordset)) return res.status(200).send({ bills: [] })

  //   const bills = selectData.recordset;
  //   // sorts if paid/not paid then by date
  //   const billsSortedByDate = bills.sort((a, b) => b.settled - a.settled || b.statementdate - a.statementdate);

  //   return res.status(200).send({ bills: billsSortedByDate });
  // });
});

//#endregion

module.exports = router;