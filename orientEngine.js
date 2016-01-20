var OrientDB=require('orientjs');
var jsonParser=require('./jsonparser.js')
var orntConnObj;
var log=require('./utils/logger.js');
var orientServer=function(serverName){
	this.server={};
	this.serverName=serverName;
	this.dbName="";
	//this.db;
	this.schemaFilePath="";
};

orientServer.prototype.getServer=function(){return this.serverName}
orientServer.prototype.setServer=function(name){this.serverName=name;console.log("this.serverName="+this.serverName);}
orientServer.prototype.setSchemaFilePath=function(path){this.schemaFilePath=path;}
orientServer.prototype.start=function(){
 // this.serverObj={ name: "local",
  // host: "localhost",
  // port: 2424,
  // username: "root",
  // password: "root" } 
  var obj = this;
  return new Promise(function(resolve,reject){
	if(obj.serverObj){ // server already loaded, jus start;
	console.log(obj.serverObj);
		this.server=OrientDB(this.serverObj);
		 this.server.list()
							.then(function (dbs) {
							  console.log('There are ' + dbs.length + ' databases on the server.');
								//callback(null,this.serverObj);
								resolve(this)
							});
	}
	else {
		//else, load the schema and then start	
		obj.loadServerSchema(function(err,val){
			
			if(err) throw err
			obj.serverObj=val;
			console.log(" .. testing callback")
			console.log(obj.serverObj);
			obj.server=OrientDB(obj.serverObj);
			resolve(obj);
		
		})
	} // end of else
  });//end of promise
//		return "server blank";
	
	
} // End of Start method

orientServer.prototype.loadServerSchema=function(callback){
	var obj = this;
	console.log("Gonna read the json from orient_connect.json")
	jsonParser.fromFile("orient_connect.json",function(err,contents){
			if(err) {console.log(err);callback(err,null);}
			console.log(contents.servers[0]);
			var arr=contents.servers;
			for(var i=0;i<arr.length;i++){
				console.log(arr[i].name+"##"+obj.getServer())
				if(arr[i].name==obj.serverName)
				{	console.log("Found server");	
				console.log(arr[i]);
					return callback(null,arr[i])}
			}
			return callback("Server not found",null);
				
	})	
} // End of loadServerSchema

orientServer.prototype.shutdown=function(){
	this.db.close();
	this.server.close();
}

orientServer.prototype.createClass=function(className){
	

	this.db.class.get(className)
	.then(function (className) {
	  console.log('Got class: ' + className);
	}
	
	,function(err){
		//Class does not exists;
		this.db.class.create(className)
			.then(function (className) {
			console.log('Created class: ' + className.name);
			return  className;
		}
		);
	});	
	return ""	
}
orientServer.prototype.getStats=function(dbName){
	
	//this.server.db.query
}
orientServer.prototype.openDb=function(dbName){
	
	var cur = this;
	return new Promise(function(resolve,reject){	
		var findDb=function(element,index,array)
		{ console.log(element.name+"=="+dbName) 
		
		 if (element.name==dbName) return true;
		   else return false;
		}
		//reject(1)
		try{
			cur.server.list()
			.then((dbs)=>{
				cur.dbList=dbs;				
				if(!dbs.find(findDb)) { // database not found
					log.info("database "+dbName+" not found. Creating one")
					cur.createDb(dbName)
					.then(val=>{
						log.info("database created:"+val.name);
						cur.db=val;
						cur.db=cur.server.use(dbName);
						resolve(val)	
					})
					.catch(err=>
						{
							log.info("Orient Database cannot be created - "+err);						
						throw err
						}
					)
				}
				else // database already present
				{
					log.info("found the database:"+dbName)
					cur.db=cur.server.use(dbName)			
					resolve(dbName)					
				}
				
			})
			.catch(err =>{throw err});
		}catch(e){
			log.info(e);
			throw e;
		}
	}	);	
	
}
orientServer.prototype.createDb=function(dbName){
	var cur=this;
	return new Promise(function(resolve,reject){
		var dbObj={};
		dbObj.name=dbName;
		dbObj.type="graph";
		dbObj.storage="plocal";
		try{
			cur.server.create(dbObj)
			.then(db=>{log.info("created db="+dbName); resolve(dbName);
		})
		}catch(e){log.error(e); throw e;}
	});
	
}
/* orientServer.prototype.openDb=function(dbName){
	try{
		log.info("before server.use-"+dbName);
		this.db= this.server.use(dbName);
		return this.db;
		//if (!this.db.name) throw "unable to open "+ dbName
		//log.debug("after server.use");
	 }	catch(err){
		 log.info("in catch")
		 throw err
	 }
	// finally{
		//this.db.open().then(function(val){return this.db;},function(err){log.debug(err);return null;});
	// }
	//
			/* var bkmk = this;
	var dbName=dbName;
	this.server.create({
	  name: dbName,
	  type: 'graph',
	  storage: 'plocal'
	})
.then(function (db) {
  console.log('Created a database called ' + db.name);
  this.db=db;
  return db;
}
,function(err){
	
	log.error("could not create the database "+err+"..Trying to use");
	bkmk.db=bkmk.server.use(dbName)
	  // .error(function(err){
		// console.log('An error ocurred', err);
		// });
		console.log(bkmk.db)
	return bkmk.db;
	
}); */

module.exports=orientServer;
