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
var fs = require('fs');
var OrientDB=require('orientjs');

var jsonParser = require("./jsonparser.js");
var sqlEngine = require("./sqlEngine.js")
var oracleJsonFile = "oracle_connect.json", oracleDbName="",vFilePath="vertex_schema.json",eFilePath="edge_schema.json", schemaPath="";
var utils = require("./utils.js");
var schemaParser = require('./schemaParser.js');
var vParser = new schemaParser();
var eParser = new schemaParser();
var globals={};
var timer={};
var vertexTElap,edgeTElap;
timer.date=new Date();
timer.start=function(){
	this.startMs = Date.now();
	return this;
}

timer.end=function(){
	this.endMs = Date.now();
	return this;
}
timer.getDiff=function(){
	this.lastElapsedMs = this.endMs-this.startMs;
	console.log("Time elapsed in milliseconds=",this.lastElapsedMs);
	return this.lastElapsedMs;
}
globals.vertexFlag=true;
globals.edgeFlag=true;
/********/




/*******/

 var orientServer = require("./orientEngine.js");
 var oServer= new orientServer("local");
log.info("oServer.serverName"+oServer.serverName);



var rdbConn={};
var fetchArgs=function(){
	oracleDbName=process.argv[2]
	orientDbName = process.argv[3]
	schemaPath=process.argv[4]
	if(schemaPath) 
	{
		vFilePath = schemaPath + "\\" + vFilePath;
		eFilePath = schemaPath + "\\" + eFilePath;
	}
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
		try{	
		//@Promise 1	
		var connectRdbP = new Promise(function(resolve,reject){
			
			sqlEngine.connectDb(rdbName,function(err,connection){
				
				if(err) {
					//try{
					console.log(err.toString()+"-failed in connectDb");
					reject(err);
					/*}catch(e){
						log.debug("in p1 catch")
						throw e;}*/
				//errBkt.push(err);
			    }
				else{
					//if no errors 
					console.log("in sql engine")
					rdbConn = connection;			
					//console.log(rdbConn)
					//done(rdbConn);
					resolve(connection);
				}	
  			});
		});
		
		//@Promise 2
		var connectOdbP =function(){
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
					.then(odb=>{
						//oServer.getStats(dbName);
						log.info("in openDb.then()")
						resolve(odb);
					})
					.catch(e=>{log.info("Promise failed for orient...");reject(e);})
					
			}); //Promise End P2
		} //Function End P2
		
		}catch(e){reject(e)}	
		
		/*Promise.all([p1,p2()]).then(function(vals){
			
		})*/
		var respArr=[];
		connectRdbP.then(val=>{ // Connect to Oracle server
		    rdbConn=val;
		    //log.info(rdbConn)
		    respArr.push(rdbConn)
			return connectOdbP(); // Connect to Orient server
		})
		.then(odb=>{
			console.log("init Promise complete");
			//console.log(vals);
			respArr.push(odb)
			resolve(respArr);
		})
		.catch(function(e){
			log.info("in init exception...")
			reject(e);
		});
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


var mineForVertices=function(rdbConn){
	return new Promise(function(resolve,reject){
		
		var p1 = function(){
		return new Promise(function(resolvemineForVertices,reject){
			
			vParser.setRdbConn(rdbConn);
			vParser.setOrientServer(oServer);
			vParser.setVFilePath(vFilePath);
			log.info("vParser "+vParser.vFilePath)
			
			vParser.parseVertex(function(err,vJson){
				if(err){
					log.error(err);
					throw err;
					}		
					//console.log(vertexObj);
				
				vParser.commonAttrib=vJson['@meta'].attrib;
				vParser.vArr=vJson.vertices;
				log.info("before addVertexClasses")
				vParser.addVertexClasses().then(function(val){
					log.info("addVertexClasses complete")
					return vParser.buildRdbSqls("V"); //Build the sqls	
				})
				.then(function(val){
					// log.info("values from vParser")
					// log.info(vParser.vArr);
					//vParser.vArr=val.vArr;      
					console.log("return val",val);
					log.info(" *** built sqls successfully.. Proceeding to processVertices()")
					return vParser.processVertices() //process the vertices
					})
				.then(function(val){  
						resolvemineForVertices(val);
				 	 }
					);
				// END of promise calls			
			}); // END of ParseVertex
		});
		};
		
 		Promise.all([p1()])		
		.then(function(vals){
			console.log("in mineForVertices all")
			 //console.log(vals)
			resolve(vals);	}
		)
		.catch(err=>{log.error(err);throw err});	

	}); // END of PROMISE
	
}

var mineForEdges=function(rdbConn){
	return new Promise(function(resolve,reject){
		
		var p1 = function(){
		return new Promise(function(resolvemineForEdges,reject){
			
			eParser.setRdbConn(rdbConn);
			eParser.setOrientServer(oServer);
			eParser.setEFilePath(eFilePath);
			log.info("EParser ",eParser.eFilePath)
			
			eParser.parseEdge()
			.then(vals=>{	
				
				log.info("parseEdge() promise kept. Edges parsed ")
				console.log(vals)
				
				 eParser.addEdgeClasses().then((val)=>{
					log.info("addEdgeClasses complete")
					//resolvemineForEdges(1);
					return eParser.buildRdbSqls("E"); //Build the sqls	
				})
				 .then(function(val){
					// log.info("values from vParser")
					// log.info(vParser.vArr);
					//vParser.vArr=val.vArr;                        
					log.info("built sqls successfully")
					return eParser.processEdges() //process the vertices
					//resolvemineForEdges(1);
					})
				.then(function(val){  
						log.info("process Edges success..")
						resolvemineForEdges(val);
				 	 });  
				// END of promise calls	
				
			})// END of then
		});
		};
		
 		Promise.all([p1()])		
		.then(function(vals){
			console.log("in mineForVertices all")
			 //console.log(vals)
			//resolve(vals);	
			return eParser.insertEdges();
		})
		.then(vals=>{
			log.info("Edges inserted..")
			resolve(vals);
		})
		.catch(err=>{log.error(err);throw err});	

	}); // END of PROMISE
	
}
/******************/

/********************************
--------MAIN STARTS HERE---------
*********************************/

fetchArgs();
//try{
 init(oracleDbName)
 .then((vals)=>{	
	rdbConn = vals[0]
	log.info("Init of database complete. Proceeding to mine Vertices....");
	if(globals.vertexFlag)
	{	timer.start();
		return mineForVertices(rdbConn)}
	else
		return Promise.resolve(1);
 })
 
 .then((vals)=>{ 
		
		console.log(" Vertex Schema Parsed. Proceeding to mine Edges....");	
		vertexTElap = timer.end().getDiff();
		if(globals.edgeFlag)
		{
			timer.start();
			return mineForEdges(rdbConn);
			}
		else
			Promise.resolve(1)
 })
.then(vals=>{
	console.log("Edges schema Parsed and Built. Proceeding to shutdown...")
	edgeTElap = timer.end().getDiff();
	
	
	return shutdown(rdbConn);		
}) 
.then((val)=>{ //Shutdown
				console.log("shutdown complete")
				console.log("Time elapsed, for Vertices ", vertexTElap, "\n for Edges: ", edgeTElap);
				})
				
				// ,function(err){console.log(err);
				// }
				
			
 .catch(err=>{log.error("in Final catch - Failed: - "+err); throw(err);})
/*}catch(e){
	log.error("In final catch")
	log.info(e)
}*/
 log.info("THE END")
 