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
				return cur.listClasses();
			})
			.then(val=>{ // cache the class list
			  val.forEach(function(element,index,array){
				console.log(element.name);
			  });
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
orientServer.prototype.listClasses=function(){
	var cur=this;
	cur.classList=[];
	return new Promise(function(resolve,reject){
		try{
		cur.db.class.list()
		.then(function (classes) {
			cur.classList=classes;
		  console.log('There are ' + classes.length + ' classes in the db:');		  
		  resolve(classes);
		});
		}catch(e){log.error(e); throw e;}
	});
	
}

orientServer.prototype.createClass=function(className,superClass){
	var cur=this;
	var srchStr=className;		
		if(cur.classList.find(function(el,idx,arr){
				if(el.name==className) return true;
		}) //end find	
		){ return Promise.resolve(1)}
		else {
			return new Promise(function(resolve,reject){

			try{
			 cur.db.class.create(className, superClass)
				.then(function (val) {
				log.debug('Created class: ' + val.name);
				resolve(val);			
			})
			.catch(e=>{throw e})
			; //end then	
			}catch(e){throw e}
		}); //end of Promise			
		} // end else
		
	
} //end function

orientServer.prototype.getStats=function(dbName){
	
	//this.server.db.query
}


module.exports=orientServer;
