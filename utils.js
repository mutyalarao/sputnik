
var xformLobResults=function(res_,clobSet_){
	return new Promise((resolve,reject)=>
	{
		var result=res_;
		var clobSet=clobSet_;
	//	console.log("in xformLobResults, result=",result.rows.length)
		//Get the indexes of the clob columns
		var clobIdx=new Set();
		for (i in result.metaData){
			if(clobSet.has(result.metaData[i].name)) // if the column of result is a CLOB
			{
				clobIdx.add(i);
			}
		}
	//	console.log("in xformLobResults, clobIdx=",clobIdx)
		//Send each row with the clobIdx
		
		var pArr = []
		for(i in result.rows)
				pArr.push(xformLobRows(result.rows[i],clobIdx))
			
		Promise.all(pArr)
		.then(data=>{
			console.log("***in then of xformLobResults->Promise->All=",data.length)
			for(m in data) //The returned value will be an array of ROWs
				result.rows[m]=data[m];
				
			resolve(result)
		})
	}) //END Promise
} //END xformLobResults

var xformLobRows = function(row_,clobIdx_){
	var row = row_;
	var clobIdx = clobIdx_;
	return new Promise((resolve,reject)=>
	{
		var pArr = [];
		for(i in row)
			{ 
			if(clobIdx.has(i)){
					pArr.push(getTextFromLob(row[i])); // IF in Clob, call xform
				}
			else
				pArr.push(Promise.resolve(row[i])) // if not in Clob map, resolve with the actual val
				
			
			}
		
		Promise.all(pArr)
		.then(vals=>{
			//console.log("in then of xformLobRows->Promise->All=",vals.length)
			for (m in vals)
				row[m] = vals[m];
			
			resolve(row)

		})
		
	})
} // end xformLobRows

var getTextFromLob=function(val){
	return new Promise((resolve,reject)=>{
	
		var lob=val;
	   var clob="";
	  
	    if(lob === null) {lob=""; resolve("");}
		
		else {
			if(lob.chunkSize>0){
			    // console.log("inside if");
			    lob.setEncoding('utf8');
			     lob.on('data', function(chunk){				            
							//console.log("lob.on 'data' event");
				            clob += chunk;
				             });
							 
				//lob.on('readable',()=>{clob=lob.read();})
			      lob.on('end',
				            function()
				            {
				              console.log("lob.on 'end' event.."+clob);
				             // console.log("clob size is " + clob.length);
				              resolve(clob);
				            }); 
			 }
			 else resolve(val)
		}
	})//END Promise
} // END getTextFromLob

   
exports.xformLobResults = xformLobResults;
	
   // })
    


