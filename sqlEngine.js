/* HIGH LEVEL LOGIC
Comps
-main.js
--sqlgenerator.js
-JsonReader.js
*/

/*
-can connect to an oracle db = connect
-read oracle_connect.json
-can frame a sql for a vertex object
-can execute a sql and return result
*/
var fs = require('fs');
var async = require('async');
var oracledb = require('oracledb'); 
oracledb.maxRows=500000; 
var jsonParser = require("./jsonparser.js");
var oracleJsonFile="oracle_connect.json";
var connection={};
var getConnObj=function(returnConnObj){
	
	jsonParser.fromFile("oracle_connect.json",function(err,orclConnObj){
			//console.log(contents)			
			returnConnObj(null,orclConnObj)
	})	
}
var connectDb=function(dbName,retConnection){
	getConnObj(function(err,connObj){
		if(err) {console.log(err); return;} 
		else console.log(connObj[dbName])
		console.log(connObj) 
		oracledb.getConnection(connObj[dbName.toLowerCase()],function(err,connection){
			if(err) {console.log(err+"-failed in oracledb.getConnection"); retConnection(err,null);}
			retConnection(err,connection);
		})
	})
	
}

var generateSQL=function(vObj,callback){}

var closeConnection=function(conn,callback) {  
     conn.release(function(err) {  
               if (err) {
				   console.error(err.message);
				   return callback(null)
			   }  
			   return callback(null);
          });  
} 



 /* async.waterfall([
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
])  */

exports.connectDb= connectDb;
exports.closeConnection=closeConnection;
	