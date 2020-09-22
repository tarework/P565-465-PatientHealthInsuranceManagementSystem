const jwt = require('jsonwebtoken');
const role = require('./roleroutes');
const {JWT_SECRET} = require('../utils/constants');

module.exports = function (req, res, next) {
	const token = req.header('Authorization');
	if (!token) return res.status(401).send('Access Denied: No Token Provided!');
	try {
		const decoded = jwt.verify(token.replace("Bearer ", ""), JWT_SECRET);
		if(role[decoded.db].find(function(url){ return `/api/${url}` == req.baseUrl})) {
			next();
		} else
			return res.status(401).send('Access Denied: You dont have correct privilege to perform this operation');
	}
	catch (ex) {
		res.status(401).send('Invalid Token');
	}
}