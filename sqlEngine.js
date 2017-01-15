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
var Promise = require('bluebird');
var fs = require('fs');

var oracledb = require('oracledb'); 
var events = require('events');
var eventEmitter = new events.EventEmitter();
oracledb.maxRows=500000; 
var jsonParser = require("./jsonparser.js");

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

var executeResultSet=function(conn,sql,binds,callback){
	var connection = conn;
	var gRows=[];
	var gMetaData=[];

	var processResultSet=function(connection, resultSet, numRows){
		return new Promise((resolve,reject)=>{
		
			function fetchRowsFromRS(connection, resultSet, numRows)
				{
					//console.log(numRows);
				  resultSet.getRows(numRows,
					function(err,rows)
					{
					  if (err) {
							resultSet.close(function(err){
								reject(err);
							}); // always close the result set. ##ERR
					  } else if (rows.length === 0) {    // no rows, or no more rows. ##STOP
							//console.log("\nNo more rows ", sql, " row count ", gRows.length)
							resultSet.close(function(err){
								var result={
								"metaData":gMetaData
								,"rows":gRows
								}
								
								if(err){
									reject(err);
								}
								else resolve(result);
							}); // always close the result set
						
					  } else if (rows.length > 0) {  // ##NEXT					
							//console.log("going to next")
							gRows=gRows.concat(rows);
							fetchRowsFromRS(connection, resultSet, numRows);
					  }
					});
				} // END Function
				fetchRowsFromRS(connection, resultSet, numRows);
		}) //END Promise
	} //END Function
	
	


	//****MAIN********
	var numRows=10000;
	console.log("\n@@Executing SQL,", sql);
	connection.execute(sql ,binds, { resultSet: true }, // return a result set.  Default is false
		  function(err, result)
		  {
			
			if (err) { callback(err,null);}
		    gMetaData=result.resultSet.metaData;	
	console.log("...Execution started...", gMetaData)
			//START processing the resultSet
			processResultSet(connection, result.resultSet, numRows)
			.then(r=>{
				console.log("SQL executed. ", sql, " Row count ", r.rows.length);
				callback(null,r);
			})
			.catch(e=>{
				callback(e,null);
			})
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
exports.executeResultSet=executeResultSet;
	