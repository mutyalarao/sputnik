/* HIGH LEVEL LOGIC
Comps
-main.js
-sqlgenerator.js
-JsonReader.js
*/

var fs = require('fs');
var async = require('async');
var oracledb = require('oracledb');  
var jsonParser = require("./jsonparser.js");
var oracleJsonFile="oracle_connect.json", oracleDbName="hr920u13";

function doRelease(connection) {  
     connection.release(  
          function(err) {  
               if (err) {console.error(err.message);}  
          }  
     );  
}  

 async.waterfall([
function(callback){
	jsonParser.fromFile("oracle_connect.json",function(err,orclConnObj){
			//console.log(contents)			
			callback(null,orclConnObj)
})}
,function(arg1,callback){
	var connJson=arg1[oracleDbName];
	console.log("connecting to:"+arg1[oracleDbName].connectString); 
	oracledb.getConnection(connJson, function(err, connection) {  
		 if (err) {  
			  console.error(err.message);  
			  return;  
		 }  
		 
		 connection.execute( "SELECT RECNAME,FIELDCOUNT,LASTUPDDTTM FROM psrecdefn",  
		 [],  
		 function(err, result) {  
			  if (err) {  
				   console.error(err.message);  
				   doRelease(connection);  
				   return;  
			  }  
			  console.log(result.metaData);  
			  console.log(result.rows);  
			  doRelease(connection);  
			  callback(null,"2nd stmt")
		 });  
	});  
	}
]) 
	//console.log("i will wait	")
	
/*var EventEmitter = require('events');  
var util = require('util');

function MyThing() {  
  EventEmitter.call(this);

  //doFirstThing();
  setImmediate(emitFunc,this)
  
}

MyThing.prototype.knock=function(){
	setImmediate(emitFunc2,this)
	
}
emitFunc = function(self){
	self.emit('thing1');
}

emitFunc2 = function(self){
	self.emit('thing2');
}
util.inherits(MyThing, EventEmitter);

var mt = new MyThing();

mt.on('thing1', function onThing1() {  
  // Sorry, never going to happen.
  console.log('hoi')
});
mt.knock();
mt.on('thing2', function onThing1() {  
  // Sorry, never going to happen.
  console.log('hoi2')
});*/