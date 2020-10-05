var express = require("express"),
    router = express.Router(),
    empty = require('is-empty'),
    moment = require('moment'),
    mail = require('../utils/mail'),
    { poolPromise, doQuery, sql } = require('../db');

router.get('/:id', function(req, res) {
  let query = `select * from patientUsers where id = ${req.params.id};`;
  let params = [];
  doQuery(res, query, params, function(data) {
    if(empty(data.recordset)) {
      res.status(400).send({error: "Patient record does not exist."})
    } else {
      res.send({...data.recordset[0], userType: 'patient'});
    }
  });
});

module.exports = router;