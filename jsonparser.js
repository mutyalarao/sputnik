var fs = require('fs');
onReadFile=function(err,contents,callback){
	
	//return callback(err,JSON.parse(contents.toString()));
	//return JSON.parse(contents.toString());
	callback(err,"Hiiii");
}


exports.fromFile = function(filePath,callback)
{
 fs.readFile(filePath,function(err,contents){
	callback(err,JSON.parse(contents.toString()))
}); 

//fs.readFile(filePath,onReadFile);

}