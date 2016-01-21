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

 var orientServer = require("./orientEngine.js");
 var oServer= new orientServer("local");
log.info("oServer.serverName"+oServer.serverName);



var rdbConn={};
var fetchArgs=function(){
	oracleDbName=process.argv[2]
	orientDbName = process.argv[3]
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
            
			resolve(vObj);
		});
		//})(this.vArr);
		//doneSql();
}
var insertVertices=function(){
		 //return new Promise(function(resolve,reject){
			var cur=this;
			/*Loop through the vertices
			 - for each, loop through the results
			   -For each row, insert an vertex
			     #insert a vertex (set the class and attribs)
			*/
			/*var pArr1=[];
			//pArr1.splice(0,pArr.length);
			log.info("vArr count="+cur.vArr.length)
			resolve(1);
			for(var vi2=0;vi2<10;vi2++){				
			log.info("inside vertex loop "+vi)
				pArr1.push((function(vertex){
					log.info("inside vertex loop "+vertex.Class)
					return new Promise(function(resolve,reject){
					 
						oServer.createClass(vertex.class,"V")
						.then(val=>{
							resolve(val);
						})//end then
					}); // end promise
				})(cur.vArr[i])// End anon function
				)// End push
				log.info("in insertVertices");
				if(vi2==1) resolve(1);
			} //end for
		 });*/
			return Promise.resolve(1);
			
			
			
		} // End of function insertVertices
schemaParser.prototype.processVertices=function(){
	//Fire the sql from the sql attrib of the vertex obj
	//var doneVCount=0;
	var vpObj=this;
	var pArr=[];
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
			
		
		
		
		
		for(var pi=0;pi<vpObj.vArr.length;pi++){
			//cout("in vpObj Loop")
            //cout(vpObj.vArr[pi])
            pArr.push(execSql(vpObj.vArr[pi]));
		}
        console.log(pArr)
		Promise.all(pArr).then(function(val){
			console.log("All promises kept for process Vertex");
			log.info(oServer.classList.length)
				return insertVertices();
				//return Promise.resolve(1);
		})
		.then(val=>{ // Hanlding Promise array for all vertices 
		
			resolve(val);
		})
		.catch(e=>{throw e});
		
	
	});	//End of parent promise
}
//schemaParser.prototype.setEFile=function(file){this.eFile=file}
/****************
@SETUP PROMISES
******************/
var init=function(rdbName){
	
	try{
	if(!rdbName ) throw "Argument for db name missing" 
	else if(!orientDbName) throw "Argument for orient db name missing";		
	}catch(e){log.info("in init catch"); throw e}
	
	return new Promise(function(resolve,reject){
		var resObj=[];		
		
		//@Promise 1	
		var p1 = new Promise(function(resolve,reject){
			sqlEngine.connectDb(rdbName,function(err,connection){
			if(err) {
				console.log(err.toString()+"-failed in connectDb");
				throw err;
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
		//@Promise 2
		var p2 =function(){
			
			   	//console.log("3:oServer.serverName"+oServer.serverName)
				return new Promise(function(resolve,reject){
	
					
					oServer.setSchemaFilePath("orient_connect.json");
	
					oServer.start().then(
						function(val){
							log.info("inside oServer.start().then")
							try{
							//	log.info(oServer)
							return val.openDb(orientDbName);
							}catch(e){log.info(e); throw e;}
							//resolve(1)}
					})				
					.then(val=>{
						//oServer.getStats(dbName);
						log.info("in openDb.then()")
						resolve(1);
					})
					.catch(e=>{throw e;})
					
			}); //Promise End P2
		} //Function End P2
				
		Promise.all([p1,p2()]).then(function(vals){
			console.log("init Promise complete");
			//console.log(vals);
			resolve(vals);
		}
		//,function(err){log.error("rejected in Init Promise-"+err);reject(err)}
		);
	}); //end of Init Promise
}

var shutdown= function(rdbConn){
	
	var p1= new Promise(function(resolve,reject){
		cout("","-shutting down Oracle")
		sqlEngine.closeConnection(rdbConn,function(err){
			if(err) throw err;
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


var mineRdb=function(rdbConn){
	return new Promise(function(resolve,reject){
		
		var p1 = function(){
		return new Promise(function(resolvemineRdb,reject){
			vParser.setRdbConn(rdbConn);
			vParser.setVFilePath(vFilePath);
			vParser.parseVertex(function(err,vJson){
				if(err){throw err;}		
					//console.log(vertexObj);
				vParser.commonAttrib=vJson['@meta'].attrib;
				vParser.vArr=vJson.vertices;					
				
				vParser.buildRdbSqls().then(function(val){
					// log.info("values from vParser")
					// log.info(vParser.vArr);
					//vParser.vArr=val.vArr;                        
					log.info("build success")
					return vParser.processVertices()}
				
				)
				.then(function(val){  // processVertices
						resolvemineRdb(val);
				 	 }
					);
							
				
			});
		});
		};
		
 		Promise.all([p1()])		
		.then(function(vals){
			console.log("in mineRdb all")
			 //console.log(vals)
			resolve(vals);	}
		);	

	}); // END of PROMISE
	
}


/******************/

/********************************
--------MAIN STARTS HERE---------
*********************************/
var vParser = new schemaParser();
fetchArgs();
try{
 init(oracleDbName).then(function(val){
	rdbConn=val[0];
	console.log(rdbConn);
 	return mineRdb(rdbConn)
 })
 /*,function(err){log.info(err+" -init rejected");}*/ 
 .then(function(vals){ //Transform Rdb
		//console.log(vals);
		console.log("Schema Parsed");
		cout(vParser.vArr[0].results.rows[0]);
		//cout(vParser.vArr[0].resultMetaData,"=Metadata")
		return shutdown(rdbConn);		
 })
.then(function(val){ //Shutdown
				console.log("shutdown complete")}
				// ,function(err){console.log(err);
				// }
				)
			
 .catch((err)=>{log.error("Failed: - "+err)})
}catch(e){
	log.error("In final catch")
	log.info(e)
}
 log.info("THE END")
 