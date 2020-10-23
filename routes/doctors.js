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
  let query = `SELECT *, (SELECT * FROM doctorDetails WHERE doctorUsers.id = doctorDetails.id FOR JSON PATH) AS detail, (SELECT doctorSpecializations.* FROM doctorSpecializations WHERE doctorUsers.id = doctorSpecializations.id FOR JSON PATH) AS specialization FROM doctorUsers WHERE id = ${req.params.id};`;
  let params = [];

  doQuery(res, query, params, function (selectData) {
    if (empty(selectData.recordset)) return res.status(400).send({ error: "Doctor record does not exist." });

    delete selectData.recordset[0].pword;

    return res.status(200).send({ ...selectData.recordset.map(item => { let s = empty(JSON.parse(item.specialization)) ? {} : JSON.parse(item.specialization)[0]; delete item.specialization; return ({ ...item, detail: empty(JSON.parse(item.detail)) ? {} : JSON.parse(item.detail)[0], specializations: s, usertype: 'doctor' }) })[0] });
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

  // Save Specializations
  let specializations = [];
  let query = `INSERT INTO doctorSpecializations (id, allergy, immunology, anesthesiology, dermatology, diagnosticradiology, emergencymedicine, familymedicine, internalmedicine, medicalgenetics, neurology, nuclearmedicine, obstetrics, gynecology, ophthalmology, pathology, pediatrics, physicalmedicine, rehabilitation, preventivemedicine, psychiatry, radiationoncology, surgery, urology)
    OUTPUT INSERTED.*
    VALUES(@id, @allergy, @immunology, @anesthesiology, @dermatology, @diagnosticradiology, @emergencymedicine, @familymedicine, @internalmedicine, @medicalgenetics, @neurology, @nuclearmedicine, @obstetrics, @gynecology, @ophthalmology, @pathology, @pediatrics, @physicalmedicine, @rehabilitation, @preventivemedicine, @psychiatry, @radiationoncology, @surgery, @urology)`;
  let params = [
    { name: 'id', sqltype: sql.Int, value: req.body.id },
    { name: 'allergy', sqltype: sql.Bit, value: req.body.specializations['allergy'] },
    { name: 'immunology', sqltype: sql.Bit, value: req.body.specializations['immunology'] },
    { name: 'anesthesiology', sqltype: sql.Bit, value: req.body.specializations['anesthesiology'] },
    { name: 'dermatology', sqltype: sql.Bit, value: req.body.specializations['dermatology'] },
    { name: 'diagnosticradiology', sqltype: sql.Bit, value: req.body.specializations['diagnosticradiology'] },
    { name: 'emergencymedicine', sqltype: sql.Bit, value: req.body.specializations['emergencymedicine'] },
    { name: 'familymedicine', sqltype: sql.Bit, value: req.body.specializations['familymedicine'] },
    { name: 'internalmedicine', sqltype: sql.Bit, value: req.body.specializations['internalmedicine'] },
    { name: 'medicalgenetics', sqltype: sql.Bit, value: req.body.specializations['medicalgenetics'] },
    { name: 'neurology', sqltype: sql.Bit, value: req.body.specializations['neurology'] },
    { name: 'nuclearmedicine', sqltype: sql.Bit, value: req.body.specializations['nuclearmedicine'] },
    { name: 'obstetrics', sqltype: sql.Bit, value: req.body.specializations['obstetrics'] },
    { name: 'gynecology', sqltype: sql.Bit, value: req.body.specializations['gynecology'] },
    { name: 'ophthalmology', sqltype: sql.Bit, value: req.body.specializations['ophthalmology'] },
    { name: 'pathology', sqltype: sql.Bit, value: req.body.specializations['pathology'] },
    { name: 'pediatrics', sqltype: sql.Bit, value: req.body.specializations['pediatrics'] },
    { name: 'physicalmedicine', sqltype: sql.Bit, value: req.body.specializations['physicalmedicine'] },
    { name: 'rehabilitation', sqltype: sql.Bit, value: req.body.specializations['rehabilitation'] },
    { name: 'preventivemedicine', sqltype: sql.Bit, value: req.body.specializations['preventivemedicine'] },
    { name: 'psychiatry', sqltype: sql.Bit, value: req.body.specializations['psychiatry'] },
    { name: 'radiationoncology', sqltype: sql.Bit, value: req.body.specializations['radiationoncology'] },
    { name: 'surgery', sqltype: sql.Bit, value: req.body.specializations['surgery'] },
    { name: 'urology', sqltype: sql.Bit, value: req.body.specializations['urology'] }
  ];
  doQuery(res, query, params, function (insertData) {
    if (empty(insertData.recordset)) return res.status(500).send({ error: "Data not saved." })

    specializations = insertData.recordset[0];

    query = `INSERT INTO doctorDetails (id, practicename, address1, address2, city, state1, zipcode, npinumber, specializations, treatscovid, bedstaken, bedsmax) 
      OUTPUT INSERTED.* 
      VALUES (@id, @practicename, @address1, @address2, @city, @state1, @zipcode, @npinumber, @specializations, @treatscovid, @bedstaken, @bedsmax);`;
    params = [
      { name: 'id', sqltype: sql.Int, value: req.body.id },
      { name: 'practicename', sqltype: sql.VarChar(255), value: req.body.practicename },
      { name: 'address1', sqltype: sql.VarChar(255), value: req.body.address1 },
      { name: 'address2', sqltype: sql.VarChar(255), value: req.body.address2 },
      { name: 'city', sqltype: sql.VarChar(50), value: req.body.city },
      { name: 'state1', sqltype: sql.VarChar(15), value: req.body.state1 },
      { name: 'zipcode', sqltype: sql.VarChar(15), value: req.body.zipcode },
      { name: 'npinumber', sqltype: sql.VarChar(10), value: req.body.npinumber },
      { name: 'specializations', sqltype: sql.Int, value: req.body.id },
      { name: 'treatscovid', sqltype: sql.Bit, value: req.body.treatscovid },
      { name: 'bedstaken', sqltype: sql.Int, value: req.body.bedstaken },
      { name: 'bedsmax', sqltype: sql.Int, value: req.body.bedsmax }
    ];

    doQuery(res, query, params, function (insertData) {
      if (empty(insertData.recordset)) return res.status(500).send({ error: "Data not saved." })

      insertData.recordset[0].specializations = specializations;

      return res.status(200).send({ specializations: specializations, detail: insertData.recordset[0] });
    });
  });
});

// Updates doctorDetails record for doctorUser
router.put('/details', async function (req, res) {
  // Data Validation
  const { error } = ValidateDoctorDetails(req.body);
  if (error) return res.status(400).send({ error: error.message });

  // Save Specializations
  let specializations = [];
  let query = `UPDATE doctorSpecializations
   SET allergy = @allergy, immunology = @immunology, anesthesiology = @anesthesiology, dermatology = @dermatology, diagnosticradiology = @diagnosticradiology, 
   emergencymedicine = @emergencymedicine, familymedicine = @familymedicine, internalmedicine = @internalmedicine, medicalgenetics = @medicalgenetics, neurology = @neurology, 
   nuclearmedicine = @nuclearmedicine, obstetrics = @obstetrics, gynecology = @gynecology, ophthalmology = @ophthalmology, pathology = @pathology, pediatrics = @pediatrics, 
   physicalmedicine = @physicalmedicine, rehabilitation = @rehabilitation, preventivemedicine = @preventivemedicine, psychiatry = @psychiatry, radiationoncology = @radiationoncology, 
   surgery = @surgery, urology = @urology
   OUTPUT INSERTED.* WHERE id = @id`;
  let params = [
    { name: 'id', sqltype: sql.Int, value: req.body.id },
    { name: 'allergy', sqltype: sql.Bit, value: req.body.specializations['allergy'] },
    { name: 'immunology', sqltype: sql.Bit, value: req.body.specializations['immunology'] },
    { name: 'anesthesiology', sqltype: sql.Bit, value: req.body.specializations['anesthesiology'] },
    { name: 'dermatology', sqltype: sql.Bit, value: req.body.specializations['dermatology'] },
    { name: 'diagnosticradiology', sqltype: sql.Bit, value: req.body.specializations['diagnosticradiology'] },
    { name: 'emergencymedicine', sqltype: sql.Bit, value: req.body.specializations['emergencymedicine'] },
    { name: 'familymedicine', sqltype: sql.Bit, value: req.body.specializations['familymedicine'] },
    { name: 'internalmedicine', sqltype: sql.Bit, value: req.body.specializations['internalmedicine'] },
    { name: 'medicalgenetics', sqltype: sql.Bit, value: req.body.specializations['medicalgenetics'] },
    { name: 'neurology', sqltype: sql.Bit, value: req.body.specializations['neurology'] },
    { name: 'nuclearmedicine', sqltype: sql.Bit, value: req.body.specializations['nuclearmedicine'] },
    { name: 'obstetrics', sqltype: sql.Bit, value: req.body.specializations['obstetrics'] },
    { name: 'gynecology', sqltype: sql.Bit, value: req.body.specializations['gynecology'] },
    { name: 'ophthalmology', sqltype: sql.Bit, value: req.body.specializations['ophthalmology'] },
    { name: 'pathology', sqltype: sql.Bit, value: req.body.specializations['pathology'] },
    { name: 'pediatrics', sqltype: sql.Bit, value: req.body.specializations['pediatrics'] },
    { name: 'physicalmedicine', sqltype: sql.Bit, value: req.body.specializations['physicalmedicine'] },
    { name: 'rehabilitation', sqltype: sql.Bit, value: req.body.specializations['rehabilitation'] },
    { name: 'preventivemedicine', sqltype: sql.Bit, value: req.body.specializations['preventivemedicine'] },
    { name: 'psychiatry', sqltype: sql.Bit, value: req.body.specializations['psychiatry'] },
    { name: 'radiationoncology', sqltype: sql.Bit, value: req.body.specializations['radiationoncology'] },
    { name: 'surgery', sqltype: sql.Bit, value: req.body.specializations['surgery'] },
    { name: 'urology', sqltype: sql.Bit, value: req.body.specializations['urology'] }
  ];
  doQuery(res, query, params, async function (updateData) {
    if (empty(updateData.recordset)) return res.status(500).send({ error: "Data not saved." })

    specializations = updateData.recordset[0];

    query = `UPDATE doctorDetails 
      SET practicename = @practicename, address1 = @address1, address2 = @address2, city = @city, state1 = @state1, zipcode = @zipcode,
      npinumber = @npinumber, specializations = @specializations, treatscovid = @treatscovid, bedstaken = @bedstaken, bedsmax = @bedsmax
      OUTPUT INSERTED.* WHERE id = @id`;
    params = [
      { name: 'id', sqltype: sql.Int, value: req.body.id },
      { name: 'practicename', sqltype: sql.VarChar(255), value: req.body.practicename },
      { name: 'address1', sqltype: sql.VarChar(255), value: req.body.address1 },
      { name: 'address2', sqltype: sql.VarChar(255), value: req.body.address2 },
      { name: 'city', sqltype: sql.VarChar(50), value: req.body.city },
      { name: 'state1', sqltype: sql.VarChar(15), value: req.body.state1 },
      { name: 'zipcode', sqltype: sql.VarChar(15), value: req.body.zipcode },
      { name: 'npinumber', sqltype: sql.VarChar(10), value: req.body.npinumber },
      { name: 'specializations', sqltype: sql.Int, value: req.body.id },
      { name: 'treatscovid', sqltype: sql.Bit, value: req.body.treatscovid },
      { name: 'bedstaken', sqltype: sql.Int, value: req.body.bedstaken },
      { name: 'bedsmax', sqltype: sql.Int, value: req.body.bedsmax }
    ];

    doQuery(res, query, params, function (updateData) {
      if (empty(updateData.recordset)) return res.status(500).send({ error: "Data not saved." })

      updateData.recordset[0].specializations = specializations;

      return res.status(200).send({ detail: updateData.recordset[0] });
    });
  });
});

//#endregion

//#region GET Doctor's Patient Details

// Gets doctorUser's patients'
router.get('/:id/mypatients', async function (req, res) {
  let query = `SELECT * FROM patientDoctorRelations WHERE did = @did;`;
  let params = [
    { name: 'did', sqltype: sql.Int, value: req.params.id }
  ];
  doQuery(res, query, params, function (selectData) {
    if (empty(selectData.recordset)) return res.status(500).send({ error: "Failed to retrieve patient records." });

    const pidList = [];
    for (p = 0; p < selectData.recordset.length; p++) {
      pidList.push(selectData.recordset[p].pid);
    }

    let query = `SELECT email, fname, lname, phonenumber, 
      (SELECT address1, address2, state1, city, zipcode, birthdate, sex, height, weight1, bloodtype, smoke, smokefreq, drink, drinkfreq, caffeine, caffeinefreq 
      FROM patientMedicalData WHERE patientUsers.id = patientMedicalData.id FOR JSON PATH)
      AS detail FROM patientUsers WHERE id IN (${pidList});`;
    params = [];
    doQuery(res, query, params, async function (selectData) {
      if (empty(selectData.recordset)) return res.status(500).send({ error: "Failed to retrieve patient records." });

      return res.status(200).send({ ...selectData.recordset.map(item => ({ ...item, detail: empty(JSON.parse(item.detail)) ? {} : JSON.parse(item.detail) })) });
    });
  });
});

// Gets doctorUser's patient 
router.get('/:id/mypatient/:pid', async function (req, res) {
  let query = `SELECT * FROM patientDoctorRelations WHERE did = @did and pid = @pid;`;
  let params = [
    { name: 'did', sqltype: sql.Int, value: req.params.id },
    { name: 'pid', sqltype: sql.Int, value: req.params.pid }
  ];
  doQuery(res, query, params, function (selectData) {
    if (empty(selectData.recordset)) return res.status(500).send({ error: "Failed to retrieve patient records.1" });

    let query = `SELECT email, fname, lname, phonenumber, 
      (SELECT address1, address2, state1, city, zipcode, birthdate, sex, height, weight1, bloodtype, smoke, smokefreq, drink, drinkfreq, caffeine, caffeinefreq 
      FROM patientMedicalData WHERE patientUsers.id = patientMedicalData.id FOR JSON PATH)
      AS detail FROM patientUsers WHERE id = (${req.params.pid});`;
    doQuery(res, query, [], async function (selectData) {
      if (empty(selectData.recordset)) return res.status(500).send({ error: "Failed to retrieve patient records.2" });

      return res.status(200).send({ ...selectData.recordset.map(item => ({ ...item, detail: empty(JSON.parse(item.detail)) ? {} : JSON.parse(item.detail)[0] }))[0] });
    });
  });
});

//#endregion

module.exports = router;