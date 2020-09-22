var express = require('express'),
        app = express(),
        path = require('path'),
        port = process.env.PORT || 3002,
        hostname = process.env.HOST || '127.0.0.1',
        bodyParser = require("body-parser"),
        cors = require('cors'),
        example = require('./routes/example');

app.use(cors());

app.use(bodyParser.json({limit: '10mb'}));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use('/', express.static(path.join(__dirname, 'build')));

app.use("/api/example", example);

app.get(['/', '/*'], function(req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.use(function(req,res,next) {
  let err = new Error("Not Found");
  err.status = 404;
  next(err);
});

app.listen(port, () => {
  console.log(`Server running at ${hostname}:${port}/`);
});