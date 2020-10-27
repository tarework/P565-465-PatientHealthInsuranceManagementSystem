const { doQuery, sql } = require('../db');
const { DecodeAuthToken, ValidatePassword, ValidateUpdateUser } = require('../models/user');
const { ValidateInsuranceDetails, ValidateInsurancePlan } = require('../models/iuser');
const constants = require('../utils/constants');
const { geocoder } = require('../utils/geocoder');
const storage = require('../utils/storage');
const bcrypt = require('bcryptjs');
const empty = require('is-empty');
const winston = require('winston');
const express = require('express');
const router = express.Router();


// GET insuranceUsers and insuranceDetails
router.get('/:id', async function (req, res) {
  let query = `SELECT *, (SELECT * FROM insuranceDetails WHERE insuranceUsers.id = insuranceDetails.id FOR JSON PATH) AS detail FROM insuranceUsers WHERE id = ${req.params.id};`;
  let params = [];

  doQuery(res, query, params, function (selectData) {
    if (empty(selectData.recordset)) return res.status(400).send({ error: "Insurance record does not exist." })

    delete selectData.recordset[0].pword

    return res.status(200).send({ ...selectData.recordset.map(item => ({ ...item, detail: empty(JSON.parse(item.detail)) ? {} : JSON.parse(item.detail)[0] }))[0], usertype: 'insurance' });
  });
});

//#region PUT insuranceUsers/password/profilepic 

router.put('/user', async function (req, res) {
  // Data Validation
  const { error } = ValidateUpdateUser(req.body);
  if (error) return res.status(400).send({ error: error.message });

  // Make sure email isn't already registered in proper database table!!
  let query = `SELECT * FROM insuranceUsers WHERE email = @email and id <> @id;`;
  let params = [
    { name: 'email', sqltype: sql.VarChar(255), value: req.body.email },
    { name: 'id', sqltype: sql.Int, value: req.body.id }
  ];

  doQuery(res, query, params, async function (selectData) {
    let user = empty(selectData.recordset) ? [] : selectData.recordset[0];
    if (!empty(user)) return res.status(400).send({ error: `E-mail already registered.` });

    let query = `UPDATE insuranceUsers 
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

  let query = `SELECT * FROM insuranceUsers WHERE id = ${req.body.id};`;
  let params = [];
  doQuery(res, query, params, async function (selectData) {
    if (empty(selectData.recordset)) return res.status(400).send({ error: "Insurance record does not exist." })
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
    query = `UPDATE insuranceUsers 
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

//#region POST/PUT insuranceDetails

// Creates insuranceDetails record for insuranceUser
router.post('/onboard', async function (req, res) {
  // Data Validation
  const { error } = ValidateInsuranceDetails(req.body);
  if (error) return res.status(400).send({ error: error.message });

  let lat = null;
  let lng = null;
  await geocoder.geocode(`${req.body.address1} ${req.body.city} ${req.body.state1} ${req.body.zip}`)
    .then(function (result) {
      lat = result[0].latitude;
      lng = result[0].longitude
    })
    .catch(function (error) {
      winston.error(`Failed to find location for ${req.body.address1} ${req.body.city} ${req.body.state1} ${req.body.zip}. Error: ${error}`)
      return res.status(400).send({ error: "Address is invalid." });
    });

  let query = `INSERT INTO insuranceDetails (id, companyname, address1, address2, state1, city, zipcode, lat, lng)  
               OUTPUT INSERTED.* 
               VALUES (@id, @companyname, @address1, @address2, @state1, @city, @zipcode, @lat, @lng);`;
  let params = [
    { name: 'id', sqltype: sql.Int, value: req.body.id },
    { name: 'companyname', sqltype: sql.VarChar(255), value: req.body.companyname },
    { name: 'address1', sqltype: sql.VarChar(255), value: req.body.address1 },
    { name: 'address2', sqltype: sql.VarChar(255), value: req.body.address2 },
    { name: 'state1', sqltype: sql.VarChar(15), value: req.body.state1 },
    { name: 'city', sqltype: sql.VarChar(50), value: req.body.city },
    { name: 'zipcode', sqltype: sql.VarChar(15), value: req.body.zipcode },
    { name: 'lat', sqltype: sql.Float, value: lat },
    { name: 'lng', sqltype: sql.Float, value: lng }
  ];

  doQuery(res, query, params, function (insertData) {
    if (empty(insertData.recordset)) return res.status(500).send({ error: "Data not saved." })

    return res.status(200).send({ detail: insertData.recordset[0] });
  });
});

// Updates insuranceDetails record for insuranceUser
router.put('/details', async function (req, res) {
  // Data Validation
  const { error } = ValidateInsuranceDetails(req.body);
  if (error) return res.status(400).send({ error: error.message });

  let lat = null;
  let lng = null;
  await geocoder.geocode(`${req.body.address1} ${req.body.city} ${req.body.state1} ${req.body.zip}`)
    .then(function (result) {
      lat = result[0].latitude;
      lng = result[0].longitude
    })
    .catch(function (error) {
      winston.error(`Failed to find location for ${req.body.address1} ${req.body.city} ${req.body.state1} ${req.body.zip}. Error: ${error}`)
      return res.status(400).send({ error: "Address is invalid." });
    });

  let query = `UPDATE insuranceDetails 
    SET companyname = @companyname, address1 = @address1, address2 = @address2, state1 = @state1, city = @city, zipcode = @zipcode, lat = @lat, lng = @lng
               OUTPUT INSERTED.* WHERE id = @id;`;
  let params = [
    { name: 'id', sqltype: sql.Int, value: req.body.id },
    { name: 'companyname', sqltype: sql.VarChar(255), value: req.body.companyname },
    { name: 'address1', sqltype: sql.VarChar(255), value: req.body.address1 },
    { name: 'address2', sqltype: sql.VarChar(255), value: req.body.address2 },
    { name: 'state1', sqltype: sql.VarChar(15), value: req.body.state1 },
    { name: 'city', sqltype: sql.VarChar(50), value: req.body.city },
    { name: 'zipcode', sqltype: sql.VarChar(15), value: req.body.zipcode },
    { name: 'lat', sqltype: sql.Float, value: lat },
    { name: 'lng', sqltype: sql.Float, value: lng }
  ];

  doQuery(res, query, params, function (updateData) {
    if (empty(updateData.recordset)) return res.status(500).send({ error: "Data not saved." })

    return res.status(200).send({ detail: updateData.recordset[0] });
  });
});

//#endregion

//#region GET/POST/PUT insurancePlans

// Get all insurance plans
// Without :id the above get captures this call
router.get('/insuranceplans/:id', async function (req, res) {
  winston.info('lol1');
  let query = `SELECT * FROM insurancePlans WHERE id = @id;`;
  let params = [
    { name: 'id', sqltype: sql.Int, value: req.body.id },
  ];
  doQuery(res, query, params, function (selectData) {
    if (empty(selectData.recordset)) return res.status(400).send({ error: "Insurance records do not exist." })

    return res.status(200).send({ plans: selectData.recordset });
  });
});

// Get a single insurance planid == planid, id = insuranceUser's id
router.get('/insuranceplan/:planid', async function (req, res) {
  let query = `SELECT * FROM insurancePlans WHERE id = @id and planid = @planid;`;
  let params = [
    { name: 'id', sqltype: sql.Int, value: req.body.id },
    { name: 'planid', sqltype: sql.Int, value: req.params.planid }
  ];
  doQuery(res, query, params, function (selectData) {
    if (empty(selectData.recordset)) return res.status(400).send({ error: "Insurance plan record does not exist." })

    return res.status(200).send({ ...selectData.recordset[0] });
  });
});

// Create a single insurance plan
router.post('/insuranceplan/', async function (req, res) {
  // Data Validation
  const { error } = ValidateInsurancePlan(req.body);
  if (error) return res.status(400).send({ error: error.message });

  let query = `INSERT INTO insurancePlans (id, planname, policynumber, premium, deductible, includesmedical, includesdental, includesvision) 
               OUTPUT INSERTED.* 
               VALUES (@id, @planname, @policynumber, @premium, @deductible, @includesmedical, @includesdental, @includesvision);`;
  let params = [
    { name: 'id', sqltype: sql.Int, value: req.body.id },
    { name: 'planname', sqltype: sql.VarChar(255), value: req.body.planname },
    { name: 'policynumber', sqltype: sql.VarChar(255), value: req.body.policynumber },
    { name: 'premium', sqltype: sql.Int, value: req.body.premium },
    { name: 'deductible', sqltype: sql.Int, value: req.body.deductible },
    { name: 'includesmedical', sqltype: sql.Bit, value: req.body.includesmedical },
    { name: 'includesdental', sqltype: sql.Bit, value: req.body.includesdental },
    { name: 'includesvision', sqltype: sql.Bit, value: req.body.includesvision }
  ];

  doQuery(res, query, params, function (insertData) {
    if (empty(insertData.recordset)) return res.status(500).send({ error: "Data not saved." })

    return res.status(200).send({ detail: insertData.recordset[0] });
  });
});

// Update a single insurance plan
router.put('/insuranceplan/:planid', async function (req, res) {
  // Data Validation
  const { error } = ValidateInsurancePlan(req.body);
  if (error) return res.status(400).send({ error: error.message });

  let query = `UPDATE insurancePlans 
    SET planname = @planname, policynumber = @policynumber, premium = @premium, deductible = @deductible, includesmedical = @includesmedical, includesdental = @includesdental, includesvision = @includesvision
    OUTPUT INSERTED.* WHERE planid = @planid;`;
  let params = [
    { name: 'planid', sqltype: sql.Int, value: req.params.planid },
    { name: 'planname', sqltype: sql.VarChar(255), value: req.body.planname },
    { name: 'policynumber', sqltype: sql.VarChar(255), value: req.body.policynumber },
    { name: 'premium', sqltype: sql.Int, value: req.body.premium },
    { name: 'deductible', sqltype: sql.Int, value: req.body.deductible },
    { name: 'includesmedical', sqltype: sql.Bit, value: req.body.includesmedical },
    { name: 'includesdental', sqltype: sql.Bit, value: req.body.includesdental },
    { name: 'includesvision', sqltype: sql.Bit, value: req.body.includesvision }
  ];

  doQuery(res, query, params, function (insertData) {
    if (empty(insertData.recordset)) return res.status(500).send({ error: "Data not saved." })

    return res.status(200).send({ detail: insertData.recordset[0] });
  });
});

// Update a insurance plan's explaination of benefits pdf
router.put('/insuranceplan/:planid/benefitspdf', async function (req, res) {
  // Data Validation
  if (empty(req.body.pdf)) return res.status(400).send({ error: "PDF data is required." });

  let token = DecodeAuthToken(req.header(constants.TOKEN_HEADER));
  container = token.usertype + token.id;

  storage.UploadFile(container, req.body.planname, req.body.pdf)
    .then((message) => {
      return res.status(200).send({ result: message.result, response: message.response });
    }).catch((error) => {
      return res.status(500).send({ error: error.message });
    });
});

//#endregion

module.exports = router;