var express = require('express')
 //, user = require('./routes/user')
  , http = require('http')
  , path = require('path')
,fs = require('fs');
//var parse = require('csv-parse');
//var transform = require('stream-transform');

var bodyParser = require('body-parser');

var multer = require('multer');
var url=require('url');
var uploadDone=false;
var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.engine('.html',  require('ejs').__express);
app.set('view engine', 'html');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());  


app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});



