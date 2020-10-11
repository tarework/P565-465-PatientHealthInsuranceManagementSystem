const constants = require('../utils/constants');
const { doQuery } = require('../db');
const { DecodeAuthToken, ValidatePassword, ValidateUpdateDetails, BuildUpdateUserSetString } = require('../models/user');
const bcrypt = require('bcryptjs');
const empty = require('is-empty');
const winston = require('winston');
const express = require('express');
const router = express.Router();

// Get User By ID
router.get('/:id', async function(req, res) {
  let query = `SELECT * FROM patientUsers WHERE id = ${ req.params.id };`;
  doQuery(res, query, [], function(selectData) {
    if(empty(selectData.recordset)) return res.status(400).send({ error: "Patient record does not exist." });

    user = selectData.recordset[0];
    delete user.pword;

    res.status(200).send( {...user, userType: 'patient'} );
  });
});

// Update User Details (THIS IS NOT UPDATING MEDICAL DATA/PROFILE PIC/ OR PASSWORD)
router.put('/updateuser/:id', async function(req, res) {
  const { error } = ValidateUpdateDetails(req.body);
  if(error) return res.status(400).send({ error: `${ error.details[0].message.replace(/\"/g, '') }` });
 

  user = DecodeAuthToken(req.header(constants.TOKEN_HEADER));
  if (user.id != req.params.id) return res.status(400).send({ error: "Token invalid."});

  setString = BuildUpdateUserSetString(req);
  
  let query = `UPDATE patientUsers
  ${setString}
  OUTPUT INSERTED.*
  WHERE id = ${user.id}`;

  // winston.info(query);

  doQuery(res, query, [], function(updateData) {
    const user = empty(updateData.recordset) ? {} : updateData.recordset[0];
    if (empty(user)) return res.status(500).send({ error: `Updating user details failed. Please try again later.` });

    delete user.pword

    return res.status(200).send({ user: user });
  });
});

// Update User Password
router.put('/updatepassword/:id', async function(req, res) {
  // Validate new password or error out
  const { error } = ValidatePassword(req.body);
  if(error)
  {
    if (error.details[0].message.includes('userType')) error.details[0].message = 'userType is invalid or empty';
    return res.status(400).send({ error: `${ error.details[0].message.replace(/\"/g, '') }` });
  } 

  // decode jwtoken and check id params
  user = DecodeAuthToken(req.header(constants.TOKEN_HEADER));
  if(user.id != req.params.id) return res.status(400).send({ error: "Token invalid."});

  // salt and hash new pword
  const salt = await bcrypt.genSalt(11);
  hashedPassword = await bcrypt.hash(req.body.pword, salt);

  // set new pword for user.id in dbs
  query = `UPDATE patientUsers
  SET pword = '${hashedPassword}'
  WHERE id='${user.id}';`;
  //winston.info(query);

  // run query
  doQuery(res, query, [], async function(updateData) { 
    // return 200
    res.status(200).send({ message: `Password Updated.` });
  });
});

// Not Done!
router.put('/updateprofilepic/:id', async function(req, res) {
  // TODO Need to verify body input
  // const { error } = Validate Anything ?(req.body);
  // if(error)
  // {
  //   if (error.details[0].message.includes('userType')) error.details[0].message = 'userType is invalid or empty';
  //   return res.status(400).send({ error: `${ error.details[0].message.replace(/\"/g, '') }` });
  // } 

  // decode jwtoken and check id params
  user = DecodeAuthToken(req.body.jwtoken);
  if(user.id !== req.params.id) return res.status(400).send({ error: "Token invalid."});

  // set new pword for user.id in dbs
  query = `UPDATE patientUsers
  SET profilePicId = '${req.body.profilePicId}'
  WHERE id='${user.id}';`;
  //winston.info(query);

  // run query
  doQuery(res, query, [], async function(updateData) { 
    // return 200
    res.status(200).send({ message: `Profile Picture Update.` });
  });
});

// Not Done!
router.put('/updatemedical/:id', async function(req, res) {

});

module.exports = router;