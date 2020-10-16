var express = require("express"),
    router = express.Router(),
    empty = require('is-empty'),
    moment = require('moment'),
    mail = require('../utils/mail'),
    { doQuery, sql } = require('../db');

// Get's doctorUser and doctorDetails
router.get('/:id', function(req, res) {
  // VALIDATION GOES HERE
  // since this gives back valid medical data we need a valid JWT 
  // HIPAA SHIT
  
  let query = `SELECT *, (SELECT * FROM doctorDetails WHERE doctorUser.id = doctorDetails.id FOR JSON PATH) AS detail FROM doctorUser WHERE id = ${req.params.id};`;
  let params = [];
  doQuery(res, query, params, function(selectData) {
    if (empty(selectData.recordset)) return res.status(400).send({ error: "Doctor record does not exist." })
    
    delete selectData.recordset[0].pword

    res.send({ ...selectData.recordset.map(item => ({...item, detail: empty(JSON.parse(item.detail)) ? {} : JSON.parse(item.detail)[0]}))[0], userType: 'doctor' });
  });
});

// Creates doctorDetails record for doctorUser
router.post('/onboard', function(req, res) {
  // VALIDATION GOES HERE

  let query = `INSERT INTO doctorDetails (id, practicename, address1, address2, state1, city, zipcode, npinumber, specializations) 
               OUTPUT INSERTED.* 
               VALUES (@id, @address1, @address2, @state1, @city, @zipcode, @npinumber, @specializations);`;
  let params = [
    { name: 'id', sqltype: sql.Int, value: req.body.id },
    { name: 'practicename', sqltype: sql.VarChar(255), value: req.body.practicename },
    { name: 'address1', sqltype: sql.VarChar(255), value: req.body.address1 },
    { name: 'address2', sqltype: sql.VarChar(255), value: req.body.address2 },
    { name: 'state1', sqltype: sql.VarChar(15), value: req.body.state1 },
    { name: 'city', sqltype: sql.VarChar(50), value: req.body.city },
    { name: 'zipcode', sqltype: sql.VarChar(15), value: req.body.zipcode },
    { name: 'npinumber', sqltype: sql.VarChar(10), value: req.body.npinumber },
    { name: 'specializations', sqltype: sql.VarChar(255), value: req.body.specializations },
  ];

  doQuery(res, query, params, function(insertData) {
    if (empty(insertData.recordset)) return res.status(400).send({ error: "Data not saved." })
    
    res.send({ detail: insertData.recordset[0] });
  });
});

// Updates patientMedicalData record for patientUser
router.put('/detail', function(req, res) {
  // VALIDATION GOES HERE
  
  let query = `UPDATE patientMedicalData SET practicename = @practicename, address1 = @address1, address2 = @address2,
   state1 = @state1, city = @city, zipcode = @zipcode, npi = @npinumber, specializations = @specializations 
   OUTPUT INSERTED.* WHERE id = @id;`;
  let params = [
    { name: 'id', sqltype: sql.Int, value: req.body.id },
    { name: 'practicename', sqltype: sql.VarChar(255), value: req.body.practicename },
    { name: 'address1', sqltype: sql.VarChar(255), value: req.body.address1 },
    { name: 'address2', sqltype: sql.VarChar(255), value: req.body.address2 },
    { name: 'state1', sqltype: sql.VarChar(15), value: req.body.state1 },
    { name: 'city', sqltype: sql.VarChar(50), value: req.body.city },
    { name: 'zipcode', sqltype: sql.VarChar(15), value: req.body.zipcode },
    { name: 'npinumber', sqltype: sql.VarChar(10), value: req.body.npinumber },
    { name: 'specializations', sqltype: sql.VarChar(255), value: req.body.specializations },
  ];

  doQuery(res, query, params, function(data) {
    if(empty(data.recordset)) return res.status(400).send( { error: "Record update failed." } )
    
    res.send( {detail: data.recordset[0]} );
  });
});

module.exports = router;