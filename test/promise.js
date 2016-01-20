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

 var myfunc=function(){
		var p1 = function(){
					return new Promise(
						function(resolve,reject) {
							console.log("in p1")
							setTimeout(function(){console.log("p1");resolve("bar")}, 100);
							//resolve(1)
							//return Promise.resolve(1)
						});
						};
		var p2 = function(){
					return new Promise(
						function(resolve, reject) {
							console.log("in p2")
							setTimeout(function(){console.log("p2");resolve("bar")}, 500);}
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
	var arr=[];
arr.push(p3());
arr.push(p2());
arr.push(p1());
	return Promise.all(arr)
	.then(function(values) { 
	console.log("All promises kept")
	  console.log(values); // [3, 1337, "foo"] 
	  resolve(1);
	}
	,function(e){
		reject(e);
	});  
}//end of function


// myfunc().then(function(val){console.log("after myfunc-"+val); return )
			// myfunc2().then(function(val){console.log("myfunc2-"+val)});
// })
myfunc2=function(a){
	if(a==1) throw "garbage"
	return new Promise(function(resolve,reject){
			
		setTimeout(resolve,2000,++a);
	})
	
}
myfunc3=function(a){
	
	return new Promise(function(resolve,reject){
		
		setTimeout(resolve,10,++a);
	})
	
}
try{
myfunc2(1).then(function(val){
	console.log("myfunc2-"+val)
	if(val==2) throw new Error("nonsense")
	return myfunc3(val)
}
//,(err)=>{console.log(err);}
)
.then(function(val){
	console.log("myfunc3-"+val)
	return myfunc3(val)
}
//,(err)=>{console.log(err);}
)
.then(function(val){
	console.log("myfunc3-"+val)
	//return myfunc3(val)
})
.catch(function(err){
	console.log("in catch"+err)
})
}catch(e){console.log("in final catch"+e);}
//.finally(function(val){console.log("finally")})
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

// var fire=function(arr,i){
	// if(i<arr.length){
		// arr[i]().then(
		// function(val){
			// console.log(val)
			// fire(arr,++i)}
		// ,function(err){console.log("failed in "+err+"-in-")
		// })}
	// else
		// return;
	
// }
// fire(arr,0);
