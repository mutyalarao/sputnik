/* var fs=require('fs');


var readF=function(filename){
	return new Promise(function(resolve,reject){
	fs.readFile(filename,function(err,contents){
		if(err) reject(err)
			else resolve(contents)
	})
});
}
var readFP=function(filename){
	return new Promise(function(resolve,reject){
	fs.readFile(filename,function(err,contents){
		if(err) reject(err)
			else {setTimeout(resolve,5000,contents)}
	})
});
}
var display=function(contents){console.log(contents.toString());};
	
var arr=[];

arr.push(readFP("test2.js"));
arr.push(readF("file1.txt"));
arr.push(readF("test2.json"));
//.catch(readF("test2.json").then(display))
Promise.all(arr).then(function(values){console.log(values.toString())});

console.log("wait2")  */

/* 
var init= new Promise(function(resolve,reject){
		var count=3;
		var p1 = Promise.resolve(3);
		var p2 = new Promise(function(resolve, reject) {
		setTimeout(resolve, 100, "bar");
			}); 
		var p3 = new Promise(function(resolve, reject) {
			setTimeout(resolve, 3000, "foo");
		});

		p3.then(function(val){count--; console.log(val); if (count<=0) resolve(1);});
		p2.then(function(val){count--; console.log(val);   if (count<=0) resolve(1);});
		p1.then(function(val){count--; console.log(val);  if (count<=0) resolve(1);});
		
		
	}) 
	init.then(function(val){console.log("init complete")});
	*/

 
var p1 = Promise.resolve(3);
		var p2 = new Promise(function(resolve, reject) {
		setTimeout(resolve, 100, "bar");
			}); 
		var p3 = new Promise(function(resolve, reject) {
			setTimeout(resolve, 3000, "foo");
		});

Promise.all([p3, p2, p1]).then(function(values) { 
  console.log(values); // [3, 1337, "foo"] 
});  

