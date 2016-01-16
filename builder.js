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
var fs = require('fs');
var async = require('async');
var jsonParser = require("./jsonparser.js");
var sqlEngine = require("./sqlEngine.js")
var oracleJsonFile="oracle_connect.json", oracleDbName="hr920u13",vFilePath="vertex_schema.json";
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
schemaParser.prototype.buildRdbSqls=function(doneSql){
		//vertObj.
		// SELECT <pkey>,[common],[attrib] FROM <SRC>
		for(var i=0;i<this.vArr.length;i++){
			var sql="", colArr=[];			
			var sqlB = new sqlBuilder();
			
			sqlB.addTable(this.vArr[i].src);			
			colArr=colArr.concat(this.vArr[i].pkey,this.vArr[i].attrib,this.commonAttrib);
			//console.log(colArr)
			sqlB.addColumns(colArr);
			
			sql=sqlB.buildSql()
			this.vArr[i].sql=sql;
		}
		doneSql();
}
schemaParser.prototype.processVertices=function(doneVertices){
	//Fire the sql from the sql attrib of the vertex obj
	var doneVCount=0;
	var resultsArr=[];
	
	for(var pi=0;pi<this.vArr.length;pi++){
			this.rdbConn.execute(this.vArr[pi].sql,[],function(err,results){
				doneVCount++;
				//this.vArr[pi].results=results;
				console.log(this)
				resultsArr.push(results);
				if(err) {console.log(err); return doneVertices(err,null);}
				
				//if(doneVCount==this.vArr.length)
				 doneVertices(null,resultsArr)
				//else 
					//return;
				
			});
			console.log("**"+pi);
	}
	
	
}
//schemaParser.prototype.setEFile=function(file){this.eFile=file}


/********************************
--------MAIN STARTS HERE---------
*********************************/
var vParser = new schemaParser();

async.waterfall(
[
function(callback){
	//function init(callback){
		async.parallel([
		function connectRdb(doneInit){
			sqlEngine.connectDb("hr92u013",function(err,connection){
			if(err) {
				console.log(err.toString()+"-failed in connectDb");
				return doneInit(err,null);
				//errBkt.push(err);
			}
		// if no errors 
			console.log("in sql engine")
			rdbConn = connection;			
			doneInit(null,rdbConn)
  			});
		}
		,function openFiles(doneInit){
			console.log("opened Files")
			doneInit(null,{})
		}
		
		]
		,function(err,results){
				console.log("in logFile function");
				console.log(results)
				callback(null,results)
		});
		
	
	}
	/*,function(arg1,callback){
		console.log("I will wait - in waterfall")
	}*/
,function(arg1,callback){
	vParser.setRdbConn(arg1[0]);
	vParser.setVFilePath(vFilePath);
	vParser.parseVertex(function(err,vJson){
		if(err){console.log(err); return;}		
		//console.log(vertexObj);
		vParser.commonAttrib=vJson['@meta'].attrib;
		vParser.vArr=vJson.vertices;
		vParser.buildRdbSqls(function(){
				console.log(vParser.vArr);
				vParser.processVertices(function(err,results){
					console.log(results.length)
				})
		});	
		//vParser.processVertex(vArr[i]);			
		
		});		
	}
]); // end of WATERFALL
console.log("I will wait - after waterfall")


/*  async.waterfall([
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