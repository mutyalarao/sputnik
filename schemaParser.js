var jsonParser=require('./jsonparser.js');
var log=require('./utils/logger.js');
var utils = require("./utils.js");
var Promise = require("bluebird");
var sqlEngine = require("./sqlEngine.js");
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
sqlBuilder.prototype.buildSelectSql=function(table,colArr,clobSet,addCond){
	//var sql = stringHelper.delimitIt(this.selectColumns,this.delim)
	// REPLACE THE CLOB COLUMNS WITH TO_CHAR
 	var tempArr=[];
	this.selectColumns.forEach((e,i,a)=>{
		
		if(e!=undefined && e!="") // Skip blanks and undefined
		{
			tempArr.push(e);
		} 
	})
	//this.selectColumns.splice(this.selectColumns.length,0);
	
	this.selectColumns=tempArr.slice(0,tempArr.length); 
	
	if(addCond){
		var addCondStr=addCond.join(" AND ")
	}
	if(clobSet.size>0){
		this.selectColumns.forEach((el,idx,arr)=>{
			if(clobSet.has(el.toUpperCase())){
				this.selectColumns[idx]="TO_CHAR("+this.selectColumns[idx]+") "+this.selectColumns[idx];
			}
		})
	}

	//var colSql="SELECT "+ this.selectColumns.join(this.delim).toString();
	var colSql="SELECT DISTINCT ",cols=[];
	this.selectColumns.forEach((e,i,a)=>{
		
		if(e!=undefined && e!="") // Skip blanks and undefined
		{
			cols.push(e);
		} 
	})
	console.log("selectColumns=",this.selectColumns)
	
	colSql += cols.join(",");
	var sql = colSql + " FROM " + function(){if(this.dbSchema){return this.dbSchema+".";} else return "";}();
	//console.log(sql);
	sql+=this.tables.join(this.delim);
	if(addCondStr)
		sql+=" WHERE " + addCondStr;
	console.log("final sql="+sql);
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
	this.eFilePath="";
	this.commons={};
	
} 
schemaParser.prototype.setOrientServer=function(obj){this.oServer=obj;}
schemaParser.prototype.setRdbConn=function(connection){this.rdbConn=connection}
schemaParser.prototype.setVFilePath=function(filePath){this.vFilePath=filePath}
schemaParser.prototype.setEFilePath=function(filePath){this.eFilePath=filePath}

schemaParser.prototype.parseVertex=function(retVertexObj){
	if(this.vFilePath=="") {console.log("no Vertex file assigned"); return null}
	log.debug("in parseVertex..");
	jsonParser.fromFile(this.vFilePath,function(err,contents){
		if(err) {
			console.log(err+"-from jsonparser.fromFile"); 
			return retVertexObj(err,null);
			}
		this.vObj=contents;
		retVertexObj(null,contents)
	})	
}

 schemaParser.prototype.parseEdge=function(){
	var cur=this;
	return new Promise((resolve,reject)=>{
		
			if(cur.eFilePath=="") 
				{
					console.log("no Edge file assigned"); 
					reject("no Edge file assigned");
				}
			
		//	log.debug("in parseEdge..");
			jsonParser.fromFile(cur.eFilePath,
				function(err,contents){
					if(err) {
						console.log(err+"-from jsonparser.fromFile"); 
						reject(err);
					}
					cur.eJson=contents;
					cur.commonAttrib = cur.eJson['@meta'].attrib;
					
					cur.eArr=cur.eJson.edges; // GEtting the array of edges
					log.info("edges="+cur.eArr);
					resolve(cur.eArr);
			})
	}) //END Promise
} //END parseEdge
 
schemaParser.prototype.addEdgeClasses=function(){
	var cur=this;
	return new Promise(function(resolve,reject){
	//	log.info("entered addEdgeClasses")
		var oServer = cur.oServer;
		var eArr = cur.eArr;
		var pArr=[];
		var pArr2=[],fArr2=[];
	//	console.log(eArr);
		eArr.forEach(function(el,idx,arr){
			//console.log("hit!!")
			var propArr=[];
			el.pkey.forEach(function(propName,idx,arr){
				//add each prop as an object
				propArr.push({name:propName,type:'STRING'})
			})
			if(el.attrib)
				el.attrib.forEach(function(propName,idx,arr){
				//add each prop as an object
				propArr.push({name:propName,type:'STRING'})
			})
		//	console.log(propArr);
			pArr.push(oServer.createClass(el.class,"E",propArr))			
			fArr2.push(function(){
				var indexName=el.class+"_UNIQUE";
				var className = el.class;
				var pkey=el.pkey;
			//	console.log("indexName=",indexName,"className=",className,"pkey=",pkey)
				return oServer.createIndex(indexName,className,pkey,"UNIQUE");
			});
		}) // END For
		log.info("testing...");
		log.info("no.of promises="+pArr.length)
		Promise.all(pArr)
		.then(function(val){
			log.info("create class for all vertices complete");
			for (i in fArr2){
				pArr2.push(fArr2[i]());
			}
			return Promise.all(pArr2);
		})
		.then(vals=>{
			log.info("create index complete for all classes");
			resolve(vals);
		})
		.catch(function(e){
			reject(e);
		})
		
	});//END of promise and function
} 
 
schemaParser.prototype.addVertexClasses=function(){
	
	var cur = this;
	
	return new Promise(function(resolve,reject){
	//	log.info("entered addVertexClasses")
		var oServer = cur.oServer;
		var vArr = cur.vArr;
		var pArr=[];
		var pArr2=[],fArr2=[];
	//	console.log(vArr);
		vArr.forEach(function(el,idx,arr){
			//console.log("hit!!")
			var propArr=[];
			el.pkey.forEach(function(propName,idx,arr){
				//add each prop as an object
				propArr.push({name:propName,type:'STRING'})
			})
			el.attrib.forEach(function(propName,idx,arr){
				//add each prop as an object
				propArr.push({name:propName,type:'STRING'})
			})
			//console.log(propArr);
			pArr.push(oServer.createClass(el.class,"V",propArr))			
			fArr2.push(function(){
				var indexName=el.class+"_UNIQUE";
				var className = el.class;
				var pkey=el.pkey;
			//	console.log("indexName=",indexName,"className=",className,"pkey=",pkey)
				return oServer.createIndex(indexName,className,pkey,"UNIQUE");
			});
		}) // END For
		log.info("testing...");
		log.info("no.of promises="+pArr.length)
		Promise.all(pArr)
		.then(function(val){
			log.info("create class for all vertices complete");
			for (i in fArr2){
				pArr2.push(fArr2[i]());
			}
			return Promise.all(pArr2);
		})
		.then(vals=>{
			log.info("create index complete for all classes");
			resolve(vals);
		})
		.catch(function(e){
			reject(e);
		})
		
	});//END of promise and function
	
}

schemaParser.prototype.detClobSet=function(arr){
 	var cur = this;
	var execSql=function(arrO){
		return new Promise((resolve,reject)=>{
			var descSql="select COLUMN_NAME,DATA_TYPE from all_tab_cols where table_name= :1";
			var clobSet=new Set();
				cur.rdbConn.execute(descSql ,[arrO.src.toUpperCase()],
					function(err,descRes){
						if(err) { console.log(descSql,err);
							reject(err);
						}
						
						descRes.rows.forEach((el,idx,arr)=>{ //Finding all CLOBS and making a list
							if(el[1]=='CLOB') //Assuming always DESCR will have the type as the 3rd column
								clobSet.add(el[0]); //Stack the column name 
							
						})
						arrO.clobSet=clobSet;
						resolve(arrO);
			}); // END execute	
		});
		
	}
	return new Promise((resolve,reject)=>{
		/* if(type == "E")
			var arr = this.eArr;
		else if (type == "V")
			var arr = vArr;
		else 
			reject("in detClobSet. Incorrect type passed. Should be either V or E")  */
		var pArr=[];
		for(i in arr){
			
			pArr.push(execSql(arr[i])); //End Push
			
		}// END For
		
		Promise.all(pArr)
		.then(arr=>{
			console.log("All classes' sqls built. ",arr)
			resolve(arr);
		})
		.catch(e=>{reject(e);})
		//console.log(descSql);
		})// END Promise
}// END Function

/*
1. Find the clob fields for all the vertex/edge classes for their source tables
2. Build sqls for each vertex/edge classes 
*/

schemaParser.prototype.buildRdbSqls=function(type){ 
	var pArr1 = [],pArr2=[];
		//Determine the clobSet
		//Then, buildsql
		//vertObj.
		// SELECT <pkey>,[common],[attrib] FROM <SRC>
		// Currently works for both edges and vertex in case of a single table
		//### Needs improvement in case of multi tables
		var cur=this;
		//var sqlB=new sqlBuilder();
		if(type=="V")
			var arr = this.vArr;
		else if(type=="E") 
			var arr = this.eArr;
			else return Promise.reject("incorrect type "+type+" passed for buildRdbSqls");
			
	return new Promise( (resolve,reject)=> {
		
		cur.detClobSet(arr) // Has an DB call to find out the CLOB fields
		.then(arr=>{
			//console.log("ClobSets determined. Proceeding to Build the sqls. arr value is:",arr)
			// NO I/O calls. Just loop and str build
			for(var i=0;i<arr.length;i++){
					try {
					var sql="", colArr=[];			
					var sqlB = new sqlBuilder();
					sqlB.addTable(arr[i].src);
					var colArr=[];
				
					arr[i].commonAttrib=[]; 
					 if(arr[i]['@meta']!="NA" ) 
						arr[i].commonAttrib=cur.commonAttrib;
					
					colArr=colArr.concat(arr[i].pkey,arr[i].attrib,arr[i].commonAttrib);
					
					

					sqlB.addColumns(colArr);
					arr[i].sql=sqlB.buildSelectSql(arr[i].src,colArr,arr[i].clobSet,arr[i].sqlCond);
						console.log("arr[i]['@meta']="+arr[i]['@meta'])
					}
					catch(e){console.log(e);}
			}
			//console.log("Built the sqls. buildRdbSqls method complete... ")
			resolve(arr)  			
			
		})		
		.catch((err)=>{console.log("in schemaParser.prototype.buildRdbSqls "+err); reject(err);})		
	}) //End Promise construct
	
} // END function


/* schemaParser.prototype.buildEdgeRdbSqls=function(){
		//vertObj.
		// SELECT <pkey>,[common],[attrib] FROM <SRC>

		var cur=this;
		return new Promise(function(resolve,reject){
			console.log("in buildRdbSqls for Edges");
			//console.log(vObj.vArr);
			
			for(var i=0;i<cur.eArr.length;i++){
				var sql="", colArr=[];			
				var sqlB = new sqlBuilder();
				
				sqlB.addTable(cur.eArr[i].src);			
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
} */


schemaParser.prototype.processVertices=function(){
	//Fire the sql from the sql attrib of the vertex obj
	//var doneVCount=0;
	var cur=this;
	var pArr=[];
	var resultsArr=[];
	//log.info("in processVertices")
	//log.info(vpObj)
	
	return new Promise(function(resolve,reject){
		//add the vertex class
				
	    // execute the vertex sql in rdb	
		var execSql=function(parser,vObj){
		    return new Promise(function(resolve,reject){
                       // log.info("in execsql")                
                        log.info(vObj.sql) 
                       // log.info(parser.rdbConn);
						
						/*================================
						EXECUTing the actual vertex sql
						================================*/
						sqlEngine.executeResultSet(parser.rdbConn,vObj.sql,[],function(err,results){	
							//this.vArr[pi].results=results;
						//	log.info("in rdbConn.execute "+vObj.sql );
							if(err) {
									console.log("Error in execsql",err); 
								reject(err);
								}
							
							//log.info("result count:"+results.rows.length)
							//log.info("results rows="+results.rows[0])
							//After Execute results, Transform the LOBs
							/* utils.xformLobResults(results,vObj.clobSet)
							.then(res=>{
								resultsArr.push(res);
								vObj.results=res;
								vObj.resultMetaData=res.metaData;
								resolve(results);
							}) */
							vObj.results=results;
							resolve(results)	;
						});
				
                        
    			}); // end of child promise
		}
		
		// Stacking up the vertices as Promises		
		
		for (pi in cur.vArr){
                    pArr.push(execSql(cur,cur.vArr[pi]));
		}
		
		//console.log(pArr)
		
		Promise.all(pArr).then(function(results){
			console.log("All promises kept for process Vertex");
			log.info(cur.oServer.classList.length);
			
				return cur.insertVertices();
				//return Promise.resolve(1);
		})
		.then(val=>{ // Hanlding Promise array for all vertices 
			log.info("Promise Kept for insertVertices")
			resolve(val);
		})
		.catch(e=>{reject(e)});
		
	
	});	//End of parent promise
}

schemaParser.prototype.insertVertices=function(){
		 //return new Promise(function(resolve,reject){
			var cur=this;
			/*Loop through the vertices
			 - for each, loop through the results
			   -For each row, insert an vertex
			     #insert a vertex (set the class and attribs)
			*/			
			
			return new Promise(function(resolve,reject){
			    var pArr=[]; //Array of promises with function to insert a vertex
				//log.info()
				//console.log("In insertVertices. Promise."+cur.vArr.length,cur.vArr)
				
				for (j in cur.vArr){ // Loop through vertex classes
					//log.info("i in cur.vArr = "+i)
				    //log.info("i="+i+"~"+"cur.vArr[i].results="+cur.vArr[i].results.length)
					var metaData = cur.vArr[j].results.metaData; // store the metadata
					//console.log("before k for=", cur.vArr[j])
					for(k in cur.vArr[j].results.rows){ 
						//log.info("k="+k)
						var recObj={};							
						for (x in metaData){ //create the record object for each column of the ROW
						//log.info("x="+x)
						  	recObj[metaData[x].name.toLowerCase()]=cur.vArr[j].results.rows[k][x]; // Create the record object
						  }	
					//	pArr.push(cur.oServer.insertVertex(cur.vArr[j].class,recObj)); // Push the function call
					
					pArr.push({"class":cur.vArr[j].class
					,"record":recObj});
						//pArr.push(return Promise.resl)
				    } // END child FOR
				} // END FOR
				
				
				// Commented code - Replaced by bluebird code.
				/* Promise.all(pArr)
				.then(function(vals){
				    log.info("in then of insert");
				    resolve(vals);
				})
				.catch(e=>{console.log("failed in insertVertices=",e); reject(e)});  */   
				
				//Bluebird variant
				Promise.map(pArr,function(obj){
					return cur.oServer.insertVertex(obj.class,obj.record);
				},{concurrency:30000}).then(v=>{resolve(v)});
			})
			
}
			//return Promise.resolve(1);			
		//} // End of function insertVertices

schemaParser.prototype.processEdges=function(){
	var cur = this;
	return new Promise((resolve,reject)=>{
		// 
		var execSql=function(eObj){
			return new Promise((resolve,reject)=>{
				/*================================
				EXECUTing the actual vertex sql
				================================*/
				//cur.rdbConn.execute(eObj.sql,[],function(err,results){	
				sqlEngine.executeResultSet(cur.rdbConn,eObj.sql,[],function(err,results){
					//this.vArr[pi].results=results;
				//	log.info("in rdbConn.execute "+eObj.sql );
					if(err) {
							console.log(err); 
						reject(err);
						}
					
				//	console.log("result metaData:",results.metaData)
					//log.info("results rows="+results.rows[0])
					//After Execute results, Transform the LOBs
					/* utils.xformLobResults(results,vObj.clobSet)
					.then(res=>{
						resultsArr.push(res);
						vObj.results=res;
						vObj.resultMetaData=res.metaData;
						resolve(results);
					}) */
					eObj.results=results;
					resolve(results)	;
				});
				
			})

			
		}// END execSql function
		
		var arr = cur.eArr;
		var pArr = [];
		
		for(i in arr){
			pArr.push(execSql(arr[i]));
		}
		
		Promise.all(pArr)
		.then(vals=>{
			log.info("Execute Sql for Edges complete");
			resolve(vals);
		})
		.catch(e=>{log.info("processEdges failed."+e); reject(e);})
	}) // END promise Structure
	
} // END processEdges
var getEdgeSubquery=function(edgeMapClass,edgeMapArr,metaData,row){
	// (select @rid from <fromClass> where [<to=from> 'AND' ... ])
	//edgeMapArr -> [[src:tgt],[src::tgt]]
	// metaData ->[ |col1 | col2 | col3 | ]
	//             -----------------------
	// row ->     [ |val1 | val2 | val3 | ] 
	var className = edgeMapClass;
	var sql = "SELECT  from "+ className;
	var whereArr=[];
	//var metaData = results.metaData;
	
	for (i in edgeMapArr){ // for every column, get the value from row --[index]--> using metadata X column
		var sourceVal="",sourceIdx=-1;
		var tgtIdx = Math.max(0,edgeMapArr[i].length-1); //if tgtIdx should be 1, else use 0 - means the column names are same
		//Cross-check through metaData Array
		
		//map values are src:tgt
		var tempArr=edgeMapArr[i].split(":")
		var operand=""
		srcCol=tempArr[0]
		if(tempArr.length==2)
			operand=tempArr[1]
		else
			operand=tempArr[0]
		
		//console.log("srcCol, tempArr, metaData",srcCol, tempArr, metaData)
		metaData.forEach(function(e,j,a)
			{
				if(e.name.toLowerCase() == srcCol.toLowerCase()) // if metadata matches the column name, stack the value[index]
				{	
				if(typeof(row[j])=='number')
					whereArr.push(operand + " = " + row[j]);
				else
					whereArr.push(operand + " = '" + row[j]+"'");
				}
			});	
	}// END For
    sql += " WHERE "+whereArr.join(" AND ");	
	return sql;
} // END Function

schemaParser.prototype.insertEdges=function(){
		 //return new Promise(function(resolve,reject){
			var cur=this;
			/*Loop through the edges
			 - for each, loop through the results
			   -For each row, insert an edge
			     #insert a vertex (set the class and attribs)
			*/			
			
			return new Promise(function(resolve,reject){
			    var pArr=[]; //Array of promises with function to insert a vertex
				
				for (j in cur.eArr){ // Loop through edge classes
					
					var metaData = cur.eArr[j].results.metaData; // get the metadata
					console.log("row count=",cur.eArr[j].results.rows.length)
					var tempA=[1,2,3,4,5];
					var cntr=0;
					
					for(k in cur.eArr[j].results.rows){ 
					//for(k in tempA){ 
					//for (var k =0;k<22000;k++){
						var eObj = cur.eArr[j];
						var eRow=cur.eArr[j].results.rows[j];
						
						// Dissect the results row with the edge class schema (eObj)						
						var paramObj={};
						/* {
							,sourceVal,
							,targetVal,							
						}
						*/
						
						var fromSql = getEdgeSubquery(cur.eArr[j].edgeMap.fromClass,cur.eArr[j].edgeMap.from,metaData,cur.eArr[j].results.rows[k]);
						var toSql = getEdgeSubquery(cur.eArr[j].edgeMap.toClass,cur.eArr[j].edgeMap.to,metaData,cur.eArr[j].results.rows[k]);
						console.log("sub queries=\n",fromSql, "\n",toSql);
						
						var edge=eObj.class;
						/* var sourceClass= eObj.from.ref.split(".")[0]; //psrecdefn from psrecdefn.recname
						var sourceCol=eObj.from.ref.split(".")[1]; //recname from psrecdefn.recname
						var fromCol = eObj.from.col; //recname
						var targetClass= eObj.to.ref.split(".")[0]; //psdbfield from psrecdefn.recname
						var targetCol=eObj.to.ref.split(".")[1]; //recname from psrecdefn.recname
						var toCol = eObj.to.col; //recname */
						//sourceCond should be sourceClassCol = row[i][j] 
						
						var contentObj={};	

						
						for (x in metaData){ //create the record object for each column of the ROW
						//log.info("x="+x)
						/*   	if(metaData[x].name.toUpperCase() == fromCol.toUpperCase()) // if the column is source
							{
								paramObj.sourceVal = cur.eArr[j].results.rows[k][x];
								
							}else if(metaData[x].name.toUpperCase() == toCol.toUpperCase()){
								paramObj.targetVal = cur.eArr[j].results.rows[k][x];
							} */
							
							contentObj[metaData[x].name.toLowerCase()]=cur.eArr[j].results.rows[k][x]; // Create the record object
							
						  }	// END For
						
						//var edgeSql="create edge "+edge+" from (SELECT FROM "+sourceClass+" where "+sourceCol+"='"+paramObj.sourceVal+"') to (SELECT FROM "+targetClass+" WHERE "+targetCol+" = '"+paramObj.targetVal+"') "
						 //var edgeSql="create edge "+edge+" from (SELECT FROM "+sourceClass+" where "+sourceCol+"= :sourceVal) to (SELECT FROM "+targetClass+" WHERE "+targetCol+" = :targetVal) "
						var edgeSql="create edge "+edge+" from ("+fromSql+") to ("+toSql+") "
						edgeSql += " content "+ JSON.stringify(contentObj)
		 				console.log(edgeSql);
						/*pArr.push(function(sql,param){
							//console.log('outside')
							return function(){
								//console.log("inside")
							return cur.oServer.execSql(sql,param);
							};
						}(edgeSql,paramObj)); // Push the function call
		 				 */
						
						pArr.push({
							"sql":edgeSql, "param":paramObj
						}) 
						
						
						//cntr++;
				    } // END child FOR
				} // END FOR
				
						
			console.log("pArr.length=",pArr.length);
			
	
		/* var events = require('events');
		var eventEmitter = new events.EventEmitter();
		
		
		eventEmitter.on('nextChunk',function(promises,st,step){
			console.log("promises,st,step=",promises.length,st,step)
			var max = promises.length;
			var end= Math.min(max,st+step);
			var exit=false;
			var pArr=[];
			
			if(end==max) exit=true;
			
			for(var i=st;i<end;i++)
			{
				pArr.push(promises[i]());
				
			}			
			
			Promise.all(pArr)
			.then((val)=>{
				console.log("Promises handled till  ",end)
				if(!exit)
				 this.emit("nextChunk",promises,end,step);
				else resolve(end);
			})
			
			
		}) // END on nextChunk */
		
	//eventEmitter.emit('nextChunk',pArr,0,50000);
	
 	Promise.map(pArr,function(paramObj){
		return cur.oServer.execSql(paramObj.sql,paramObj.param);
	},{concurrency:10000}).then((val)=>{resolve(val);})
	 
	}) // END Promise
	
}

		
module.exports=schemaParser;