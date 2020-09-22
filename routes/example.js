var express = require("express"),
    router = express.Router(),
    empty = require('is-empty'),
    moment = require('moment'),
    mail = require('../utils/mail'),
    { poolPromise, doQuery, sql } = require('../db');

router.get('/', function(req, res) {
  let query = "select * from users;";
  let params = [
    {name: 'id', sqltype: sql.Int, value: 10}
  ];
  doQuery(res, query, params, function(data) {
    res.send(data.recordset);
  });
});

module.exports = router;