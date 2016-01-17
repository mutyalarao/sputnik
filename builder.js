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

var fs = require('fs');
var async = require('async');
var jsonParser = require("./jsonparser.js");
var sqlEngine = require("./sqlEngine.js")
var oracleJsonFile = "oracle_connect.json", oracleDbName="hr920u13",vFilePath="vertex_schema.json";
var stringHelper=function(){}
stringHelper.delimitIt=function(srcArr,delimiter){
	var result="";
	if(srcArr.length>0){
		for(var i=1; i<srcArr.length;i++)	{
			result+=","+srcArr[i]
		}
		result=srcArr[0]+result;
	}
	return result;
}
var rdbConn={};

var rejectDbg=function(err,reject,msg){
	if(msg) console.log(msg)
    if(err) console.log(err)
	reject(err);
}
var print=function(val,msg){
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
            print("in buildRdbSqls")
            print(vObj.vArr)
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
	print("in processVertices")
	print(vpObj)
	return new Promise(function(resolve,reject){
		
		var execSql=function(vObj){
			return new Promise(function(resolve,reject){
                print("in execsql")                
                print(vObj.sql)
				vpObj.rdbConn.execute(vObj.sql,[],function(err,results){				
					//this.vArr[pi].results=results;
                    
					if(err) {console.log(err); rejectDbg(err,reject,"Rejected in execSql");}
					print("result count:"+results.rows.length)
					resultsArr.push(results);
					resolve(results); 
					//if(doneVCount==this.vArr.length)
					// doneVertices(null,resultsArr)
					//else 
						//return;				
				});
			}); // end of child promise
		}
			
		
		var pArr=[];
		
		for(var pi=0;pi<vpObj.vArr.length;pi++){
			//print("in vpObj Loop")
            //print(vpObj.vArr[pi])
            pArr.push(execSql(vpObj.vArr[pi]));
		}
        console.log(pArr)
		Promise.all(pArr).then(function(val){
			console.log("All promises kept for process Vertex");
			resolve(val);
		
		}
		,function(err){ rejectDbg(err,reject,"reject in process vertices") 
		});
		
	
	});	//End of parent promise
}
//schemaParser.prototype.setEFile=function(file){this.eFile=file}
/****************
@SETUP PROMISES
******************/
var init=function(){
	return new Promise(function(resolve,reject){
		var resObj=[];
		var doneCount = 2; //Total count of functions
		var done=function(val){
			console.log("in done function")
			resObj.push(val);			
				if(--doneCount<=0){
					console.log('doneCount:'+doneCount)
					resolve(resObj);
				}
			}
		//@TRACK 1	
		var p1 = new Promise(function(resolve,reject){
			sqlEngine.connectDb("hrdmo92",function(err,connection){
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
		var p2 =new Promise(function(resolve,reject){
			setTimeout(function(){
				console.log("I am counting");resolve(1);},30);
			
		});
		Promise.all([p1,p2]).then(function(vals){
			console.log("init Promise complete");
			//console.log(vals);
			resolve(vals);
		});
	}); //end of Init Promise
}

var shutdown= function(rdbConn){
	return new Promise(function(resolve,reject){
		console.log("in shutdown")
		sqlEngine.closeConnection(rdbConn,function(err){
			if(err) reject(err);
			resolve(1);
		});
		
	});
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
						print("values from vParser")
                        print(vParser.vArr);
                        //vParser.vArr=val.vArr;                        
						print("build success")
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

print("Test");
 init().then(function(val){
	rdbConn=val[0];
	console.log(rdbConn);
 	parseSchema(rdbConn).then(function(vals){
		//console.log(vals);
		console.log("Schema Parsed")
		shutdown(rdbConn).then(function(val){
				console.log("shutdown complete")}
				,function(err){console.log(err);
				});
		}
		,function(err){
			console.log("Failed in parseschema"+err)
		}
	); 
 });
 