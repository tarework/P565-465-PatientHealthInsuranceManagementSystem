const nodemailer = require('nodemailer');
const {GMAIL_PASSWORD} = require('./constants');

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: 'username@gmail.com',
    pass: GMAIL_PASSWORD
  }
});

module.exports = async (to, subject, html) => {

  const mailOpts = {
    from: 'Your sender info here', // This is ignored by Gmail
    to: to,
    subject: subject,
    html: html
  };

  try {
    await transporter.verify();
    return new Promise(function(resolve,reject) {
      transporter.sendMail(mailOpts, (error, response) => {
        if (error) {
          return reject(error);  // Show a page indicating failure
        }
        else {
          return resolve(); // Show a page indicating success
        }
      });
    });
  } catch(e) {
    console.log(e);
  }
  
}