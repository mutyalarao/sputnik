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
								resolve(this.server)
							});
	}
	else {
		//else, load the schema and then start	
		obj.loadServerSchema(function(err,val){
			
			if(err) reject(err)
			obj.serverObj=val;
			console.log(" .. testing callback")
			console.log(obj.serverObj);
			obj.server=OrientDB(obj.serverObj);
			resolve(obj.server);
			//console.log("Server object returned"+this.server.toString());
			 // this.server.list()
							// .then(function (dbs) {
							  // console.log('There are ' + dbs.length + ' databases on the server.');
								//callback(null,this.serverObj);
								// resolve(this.server)
							// });
			//callback(null,this.serverObj);
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
orientServer.prototype.openDb=function(dbName){
	//try{
		log.info("before server.use-"+dbName);
		this.db= this.server.use(dbName);
		log.debug("after server.use");
	// }	catch(err){
		// log.info("in catch")
	// }
	// finally{
		//this.db.open().then(function(val){return this.db;},function(err){log.debug(err);return null;});
	// }
	return this.db;
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
}
module.exports=orientServer;
