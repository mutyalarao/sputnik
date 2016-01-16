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

 
		var p1 = function(){
					return new Promise(
						function(resolve,reject) {
							console.log("in p1")
							resolve(1)
							//return Promise.resolve(1)
						});
						};
		var p2 = function(){
					return new Promise(
						function(resolve, reject) {
							console.log("in p2")
							setTimeout(function(){console.log("p2");resolve("bar")}, 100);}
							);
					}
		var p3 = function(){
					return new Promise(function(resolve, reject) {
					console.log("in p3")
					//resolve("foo1	")
					setTimeout(function(){console.log("p3");resolve("foo")}, 3000);
					});
				}

// var main = function(){
// return new Promise(function(reject,resolve){
	// Promise.all([p3(), p2(), p1()]).then(function(values) { 
	  // console.log(values); // [3, 1337, "foo"] 
	  // resolve(1);
	// }
	// ,function(e){
		// reject(e);
	// });  
// });
// }
// main().then(function(v){console.log(v)
	// }
	// ,function(e){
		// console.log(e)
	// });
/*p3().then(function(val){
	 p2().then(function(val){
		 p1().then(function(val){console.log("complete")})
	 })	
})*/
var arr=[];
arr.push(p1);
arr.push(p3);
arr.push(p2);
var fire=function(arr,i){
	if(i<arr.length){
		arr[i]().then(
		function(val){
			console.log(val)
			fire(arr,++i)}
		,function(err){console.log("failed in "+err+"-in-")
		})}
	else
		return;
	
}
fire(arr,0);
