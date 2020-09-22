require('dotenv').config();

const DB_PASS = process.env.DB_PASS;
const JWT_SECRET = process.env.JWT_SECRET;
const GMAIL_PASSWORD = process.env.GMAIL_PASSWORD;

module.exports = {
	DB_PASS, JWT_SECRET, GMAIL_PASSWORD
}