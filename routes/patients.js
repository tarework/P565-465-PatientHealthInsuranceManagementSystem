var express = require("express"),
    router = express.Router(),
    empty = require('is-empty'),
    moment = require('moment'),
    mail = require('../utils/mail'),
    { poolPromise, doQuery, sql } = require('../db');

router.get('/:id', function(req, res) {
  let query = `select *, (select * from patientMedicalData where patientUsers.id = patientMedicalData.id FOR JSON PATH) as detail from patientUsers where id = ${req.params.id};`;
  let params = [];
  doQuery(res, query, params, function(data) {
    if(empty(data.recordset)) {
      res.status(400).send({error: "Patient record does not exist."})
    } else {
      res.send({...data.recordset.map(item => ({...item, detail: empty(JSON.parse(item.detail)) ? {} : JSON.parse(item.detail)[0]}))[0], userType: 'patient'});
    }
  });
});

router.post('/onboard', function(req, res) {
  let query = `insert into patientMedicalData (id, address1, address2, state1, zipcode, birthdate, sex, height, weight1, bloodtype, smoke, smokefreq, drink, drinkfreq, caffeine, caffeinefreq) 
               OUTPUT INSERTED.* 
               VALUES (@id, @address1, @address2, @state1, @zipcode, @birthdate, @sex, @height, @weight1, @bloodtype, @smoke, @smokefreq, @drink, @drinkfreq, @caffeine, @caffeinefreq);`;

  let params = [
    {name: 'id', sqltype: sql.Int, value: req.body.id},
    {name: 'address1', sqltype: sql.VarChar(255), value: req.body.address1},
    {name: 'address2', sqltype: sql.VarChar(255), value: req.body.address2},
    {name: 'state1', sqltype: sql.VarChar(15), value: req.body.state1},
    {name: 'zipcode', sqltype: sql.VarChar(15), value: req.body.zipcode},
    {name: 'birthdate', sqltype: sql.VarChar(15), value: req.body.birthdate},
    {name: 'sex', sqltype: sql.VarChar(10), value: req.body.sex},
    {name: 'height', sqltype: sql.VarChar(10), value: req.body.height},
    {name: 'weight1', sqltype: sql.VarChar(10), value: req.body.weight1},
    {name: 'bloodtype', sqltype: sql.VarChar(7), value: req.body.bloodtype},
    {name: 'smoke', sqltype: sql.Bit, value: req.body.smoke},
    {name: 'smokefreq', sqltype: sql.VarChar(100), value: req.body.smokefreq},
    {name: 'drink', sqltype: sql.Bit, value: req.body.drink},
    {name: 'drinkfreq', sqltype: sql.VarChar(100), value: req.body.drinkfreq},
    {name: 'caffeine', sqltype: sql.Bit, value: req.body.caffeine},
    {name: 'caffeinefreq', sqltype: sql.VarChar(100), value: req.body.caffeinefreq}
  ];
  doQuery(res, query, params, function(data) {
    if(empty(data.recordset)) {
      res.status(400).send({error: "Data not saved."})
    } else {
      res.send({detail: data.recordset[0]});
    }
  });
});

router.put('/detail', function(req, res) {
  let query = `update patientMedicalData set address1 = @address1, address2 = @address2, state1 = @state1, zipcode = @zipcode, birthdate = @birthdate, 
               sex = @sex, height = @height, weight1 = @weight1, bloodtype = @bloodtype, smoke = @smoke, smokefreq = @smokefreq, drink = @drink, 
               drinkfreq = @drinkfreq, caffeine = @caffeine, caffeinefreq = @caffeinefreq output inserted.* where id = @id;`;
  let params = [
    {name: 'id', sqltype: sql.Int, value: req.body.id},
    {name: 'address1', sqltype: sql.VarChar(255), value: req.body.address1},
    {name: 'address2', sqltype: sql.VarChar(255), value: req.body.address2},
    {name: 'state1', sqltype: sql.VarChar(15), value: req.body.state1},
    {name: 'zipcode', sqltype: sql.VarChar(15), value: req.body.zipcode},
    {name: 'birthdate', sqltype: sql.VarChar(15), value: req.body.birthdate},
    {name: 'sex', sqltype: sql.VarChar(10), value: req.body.sex},
    {name: 'height', sqltype: sql.VarChar(10), value: req.body.height},
    {name: 'weight1', sqltype: sql.VarChar(10), value: req.body.weight1},
    {name: 'bloodtype', sqltype: sql.VarChar(5), value: req.body.bloodtype},
    {name: 'smoke', sqltype: sql.Bit, value: req.body.smoke},
    {name: 'smokefreq', sqltype: sql.VarChar(100), value: req.body.smokefreq},
    {name: 'drink', sqltype: sql.Bit, value: req.body.drink},
    {name: 'drinkfreq', sqltype: sql.VarChar(100), value: req.body.drinkfreq},
    {name: 'caffeine', sqltype: sql.Bit, value: req.body.caffeine},
    {name: 'caffeinefreq', sqltype: sql.VarChar(100), value: req.body.caffeinefreq}
  ];
  doQuery(res, query, params, function(data) {
    if(empty(data.recordset)) {
      res.status(400).send({error: "Record update failed."})
    } else {
      res.send({detail: data.recordset[0]});
    }
  });
});

module.exports = router;