/* HIGH LEVEL LOGIC
Comps
-main.js
-sqlBuilder.js
-JsonReader.js
*/

/*
schemaParser
-setOracleConn()
-parseVertex()
-parseEdge()
*/

/*
@Serial:{
-Init()
	 #Parallel{
	 -Open Files -[config, log]
	 -Open connections - [RDB, orient]
	 }
 }
-Process(){
	@Serial{
		ParseSchema(){
			#Parallel
			-Parse vertex { get the json from file }
				-generate the sqls for each vertex
			-Parse edge 
		}
		-ProcessVertex() { 
			
			#Parallel
			for each vertex
				- Execute each vertex's sql
				- Insert a vertex into orient db
			}
		
		-ProcessEdge(){
			
		}
	}
}
	
Close()
		 - Close file
		 - Close connections
}
	

*/
var log=require('./utils/logger.js');
var rsvp=require('rsvp');
var fs = require('fs');
var OrientDB=require('orientjs');
var async = require('async');
var jsonParser = require("./jsonparser.js");
var sqlEngine = require("./sqlEngine.js")
var oracleJsonFile = "oracle_connect.json", oracleDbName="",vFilePath="vertex_schema.json";
var stringHelper=function(){}

/********/




/*******/

 var orientServer = require("./orientEngine.js")
 var oServer= new orientServer("local");
log.info("oServer.serverName"+oServer.serverName);



var rdbConn={};
var fetchArgs=function(){
	oracleDbName=process.argv[2]
};
var rejectDbg=function(err,reject,msg){
	if(msg) console.log(msg)
    if(err) console.log(err)
	reject(err);
}
var cout=function(val,msg){
	if(msg) console.log(msg);
	if(val) console.log(val);
}
var sqlBuilder = function(){
	this.aliasPrefix="T";
	this.tables = [];
	this.selectColumns=[];
	this.whereClause={};
}

sqlBuilder.prototype.addTable=function(table){
	this.tables.push(table);	
}
sqlBuilder.prototype.addColumns=function(colArr){
	this.selectColumns=this.selectColumns.concat(colArr);	
}
sqlBuilder.prototype.buildSql=function(table){
	//var sql = stringHelper.delimitIt(this.selectColumns,this.delim)
	var sql="SELECT "+ this.selectColumns.join(this.delim).toString();
	console.log(sql);
	sql+=" FROM " + function(){if(this.dbSchema){return this.dbSchema+".";} else return "";}();
	//console.log(sql);
	sql+=this.tables.join(this.delim);
	return sql;
}

var schemaParser=function(){
	this.rdbConn={};
	this.vFile="";
	this.eFile="";
	this.vObj={};
	this.vArr=[];
	this.delim=",";
	this.objType="";
} 

schemaParser.prototype.setRdbConn=function(connection){this.rdbConn=connection}
schemaParser.prototype.setVFilePath=function(filePath){this.vFilePath=filePath}
schemaParser.prototype.parseVertex=function(retVertexObj){
	if(vFilePath=="") {console.log("no Vertex file assigned"); return null}
	jsonParser.fromFile(this.vFilePath,function(err,contents){
		if(err) {console.log(err+"-from jsonparser.fromFile"); return retVertexObj(err,null);}
		this.vObj=contents;
		retVertexObj(null,contents)
	})	
}

schemaParser.prototype.buildRdbSqls=function(){
		//vertObj.
		// SELECT <pkey>,[common],[attrib] FROM <SRC>

		var vObj=this;
		return new Promise(function(resolve,reject){
			console.log("in buildRdbSqls");
			console.log(vObj.vArr);
			
			for(var i=0;i<vObj.vArr.length;i++){
				var sql="", colArr=[];			
				var sqlB = new sqlBuilder();
				
				sqlB.addTable(vObj.vArr[i].src);			
				colArr=colArr.concat(vObj.vArr[i].pkey,vObj.vArr[i].attrib,vObj.commonAttrib);
				//console.log(colArr)
				sqlB.addColumns(colArr);
				
				sql=sqlB.buildSql()
				vObj.vArr[i].sql=sql;
			}
            cout("in buildRdbSqls")
            cout(vObj.vArr)
			resolve(vObj);
		});
		//})(this.vArr);
		//doneSql();
}
schemaParser.prototype.processVertices=function(){
	//Fire the sql from the sql attrib of the vertex obj
	//var doneVCount=0;
	var vpObj=this;
	var resultsArr=[];
	cout("in processVertices")
	cout(vpObj)
	return new Promise(function(resolve,reject){
		
		var execSql=function(vObj){
			return new Promise(function(resolve,reject){
                cout("in execsql")                
                cout(vObj.sql)
				vpObj.rdbConn.execute(vObj.sql,[],function(err,results){				
					//this.vArr[pi].results=results;
                    
					if(err) {console.log(err); rejectDbg(err,reject,"Rejected in execSql");}
					cout("result count:"+results.rows.length)
					resultsArr.push(results);
					vObj.results=results;
					vObj.resultMetaData=results.metaData;
					resolve(results); 
								
				});
			}); // end of child promise
		}
			
		insertVertices=function(){
			var vArr=this.vArr;
			/*Loop through the vertices
			 - for each, loop through the results
			   -For each row, insert an vertex
			     #insert a vertex (set the class and attribs)
			*/
			return new Promise(function(resolve,reject){
				
				var vi,ri;
				for(vi=0;vi<vArr.length;vi++)
				{
					
				}
				
			});
			
		}
		var pArr=[];
		
		for(var pi=0;pi<vpObj.vArr.length;pi++){
			//cout("in vpObj Loop")
            //cout(vpObj.vArr[pi])
            pArr.push(execSql(vpObj.vArr[pi]));
		}
        console.log(pArr)
		Promise.all(pArr).then(function(val){
			console.log("All promises kept for process Vertex");
			// oServer.createClass("test")
			// .then(function(val){
				// log.info("Promise complete for createClass");
				
				
			// });
			
		
		}
		,function(err){ rejectDbg(err,reject,"reject in process vertices") 
		});
		
	
	});	//End of parent promise
}
//schemaParser.prototype.setEFile=function(file){this.eFile=file}
/****************
@SETUP PROMISES
******************/
var init=function(rdbName){
	
	if(!rdbName) return Promise.reject("Argument for db name missing");
		//else if(!odbName) return Promise.reject("Argument for db name missing");
	return new Promise(function(resolve,reject){
		var resObj=[];		
		
		// var doneCount = 2; //Total count of functions
		// var done=function(val){
			// console.log("in done function")
			// resObj.push(val);			
				// if(--doneCount<=0){
					// console.log('doneCount:'+doneCount)
					// resolve(resObj);
				// }
			// }
		//@TRACK 1	
		var p1 = new Promise(function(resolve,reject){
			sqlEngine.connectDb(rdbName,function(err,connection){
			if(err) {
				console.log(err.toString()+"-failed in connectDb");
				reject(err);
				//errBkt.push(err);
			}
			//if no errors 
			console.log("in sql engine")
			rdbConn = connection;			
			//console.log(rdbConn)
			//done(rdbConn);
			resolve(rdbConn);		
  			});
		});
		//@TRACK 2
		var p2 =function(){
			
			   	//console.log("3:oServer.serverName"+oServer.serverName)
				return new Promise(function(resolve,reject){
	
					log.debug("4:oServer.serverName"+oServer.serverName)				
					oServer.setSchemaFilePath("orient_connect.json");
					//console.log("oServer.schemaFilePath:"+oServer.schemaFilePath);
					
					//resolve(1);
					oServer.start().then(function(val){
						console.log(val);
						oServer.server.list()
						.then(function (dbs) {
							console.log('There are ' + dbs.length + ' databases on the server.');
							dbName="mydb1";
							if(oServer.openDb(dbName)){
									log.info("in opendb")
									resolve(val);
								
							}
							//resolve(val);
							else
								reject("unable to open db"+dbName)
							}
							,function(err){console.log(err+"-rejected in oServer.list")}
							);
						
					}
					,function(err){console.log(err+"-rejected in oServer.start")})
					
			}); //Promise End P2
		} //Function End P2
		console.log("2:oServer.serverName"+oServer.serverName)
		Promise.all([p1,p2()]).then(function(vals){
			console.log("init Promise complete");
			//console.log(vals);
			resolve(vals);
		},
		function(err){log.error("rejected in Init Promise-"+err);reject(err)});
	}); //end of Init Promise
}

var shutdown= function(rdbConn){
	
	var p1= new Promise(function(resolve,reject){
		cout("","-shutting down Oracle")
		sqlEngine.closeConnection(rdbConn,function(err){
			if(err) reject(err);
			resolve(1);
		});	
	});
	
	var p2 = new Promise(function(resolve,reject){
		cout("","-shutting down Orient")
		oServer.shutdown();
		resolve(1);
	})
	
	Promise.all([p1,p2]).then(function(val){
		cout("","-Shutdown promise complete");
	})
}
var dummy=function(){
	return new Promise(function(resolve,reject){
		console.log("after init");
		resolve("1");
	});
}

var parseSchema=function(rdbConn){
	return new Promise(function(resolve,reject){
		var p1 = function(){
		return new Promise(function(resolveParseSchema,reject){
			vParser.setRdbConn(rdbConn);
			vParser.setVFilePath(vFilePath);
			vParser.parseVertex(function(err,vJson){
				if(err){reject(err);}		
					//console.log(vertexObj);
					vParser.commonAttrib=vJson['@meta'].attrib;
					vParser.vArr=vJson.vertices;					
					
				 	vParser.buildRdbSqls().then(function(val){
						cout("values from vParser")
                        cout(vParser.vArr);
                        //vParser.vArr=val.vArr;                        
						cout("build success")
						vParser.processVertices().then(function(val){
							resolveParseSchema(val);
						}						
						,function(err){
							rejectDbg(err,reject,"reject in processVertices");
						});
						
					}
					,function(err){
						rejectDbg(err,reject);
					}) 
							
				
			});
		});
		};
		
 		Promise.all([p1()])		
		.then(function(vals){
			console.log("in parseSchema all")
			 console.log(vals)
			resolve(vals);
		}
		,function(e){
			console.log("faile"+e)
			reject("@@")
		});	

	}); // END of PROMISE
	
}


/******************/

/********************************
--------MAIN STARTS HERE---------
*********************************/
var vParser = new schemaParser();
fetchArgs();
 init(oracleDbName).then(function(val){
	rdbConn=val[0];
	console.log(rdbConn);
 	parseSchema(rdbConn).then(function(vals){
		//console.log(vals);
		console.log("Schema Parsed");
		cout(vParser.vArr[0].results.rows[0]);
		cout(vParser.vArr[0].resultMetaData,"=Metadata")
		shutdown(rdbConn).then(function(val){
				console.log("shutdown complete")}
				,function(err){console.log(err);
				});
		}
		,function(err){
			console.log("Failed in parseschema"+err)
		}
	); 
 }
 ,function(err){log.info(err+" -init rejected");});
 log.info("THE END")
 