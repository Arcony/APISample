//Imports
var express = require('express');
var bodyParser = require('body-parser');
var apiRouter = require ('./apiRouter').router;
var cors = require('cors');

//Instantiate server
var server = express();
server.use(cors());


//Body Parser Configure
server.use(bodyParser.urlencoded({ extended: true}));
server.use(bodyParser.json());

//Configure routes
server.get('/', function(req,res) {
    res.setHeader('Content-Type','text/html');
    res.status(200).send('<h1>Hello World</h1>');
});

server.use('/api/', apiRouter);

//Launch Server
server.listen(8080, function() {
    console.log("server OK");
});

module.exports = server;
