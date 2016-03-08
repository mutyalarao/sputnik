
//var math =
var oracledb = require('oracledb'); 
var events = require('events');
var eventEmitter = new events.EventEmitter();
var numRows = 10;  // number of rows to return from each call to getRows()
var gRows=[];
var gMetaData=[];

eventEmitter.on("next",function(connection, resultSet, numRows){
	resultSet.getRows( // get numRows rows
    numRows,
    function (err, rows)
    {
      if (err) {
        console.log(err);
        doClose(connection, resultSet); // always close the result set
      } else if (rows.length === 0) {    // no rows, or no more rows
        doClose(connection, resultSet); // always close the result set
		
      } else if (rows.length > 0) {
        console.log("NExt evenet : Got " + rows.length + " rows");
        //console.log(rows);
		//console.log("metadat=",resultSet.resul.metadata);
		gRows=gRows.concat(rows);
        eventEmitter.emit('next',connection, resultSet, numRows);
      }
    });
});

eventEmitter.on('end',function(metaData,rows){
	var result={
		"metadata":metaData
		,"rows":rows
	}
	
	console.log(result.metaData);
	console.log(result.rows.length)
})

oracledb.getConnection(
  {
    user          : 'SYSADM',
    password      : 'SYSADM',
    connectString : 'HR92U013'
  },
  function(err, connection)
  {
    if (err) { console.error(err.message); return; }
    connection.execute(
      "SELECT * FROM PSMENUITEM WHERE ROWNUM<=20",
      [], // no bind variables
      {
        resultSet: true, // return a result set.  Default is false
        prefetchRows: 25 // the prefetch size can be set for each query
      },
      function(err, result)
      {
        if (err) {
          console.error(err.message);
          doRelease(connection);
          return;
        }
        //console.log(result.resultSet.metaData);
		gMetaData=result.resultSet.metaData;
        eventEmitter.emit('next',connection, result.resultSet, numRows);
		console.log("THE END");
		
		
      });
  });

function fetchRowsFromRS(connection, resultSet, numRows)
{
  resultSet.getRows( // get numRows rows
    numRows,
    function (err, rows)
    {
      if (err) {
        console.log(err);
        doClose(connection, resultSet); // always close the result set
      } else if (rows.length === 0) {    // no rows, or no more rows
        doClose(connection, resultSet); // always close the result set
      } else if (rows.length > 0) {
        console.log("fetchRowsFromRS(): Got " + rows.length + " rows");
        //console.log(rows);
		//console.log("metadat=",resultSet.resul.metadata);
		gRows.push(rows);
        fetchRowsFromRS(connection, resultSet, numRows);
      }
    });
}

function doRelease(connection)
{
  connection.release(
    function(err)
    {
      if (err) { console.error(err.message); }
    });
}

function doClose(connection, resultSet)
{
  resultSet.close(
    function(err)
    {
      if (err) { console.error(err.message); }
      doRelease(connection);
	  eventEmitter.emit('end',gMetaData,gRows);
    }
	
	);
}

// Objects are passed by references. Changes done in the function changes them.
/* var arr = [{a:1},{a:2}];

var func = function(y){
	var x =y;
	for(i in x){
		x[i].a++;
	}
}
func(arr)
console.log(arr) */

/* var arr = [1,2,3,4];
var obj={};
var s=new Set();
s.add(3)
s.add(4);
var i =2;
arr.forEach((el,idx,arr)=>{
	//var i=3;
	{
	arr[idx]=el+i; //Changes within Foreach will not change the actual element
	}
	})

console.log(arr);
console.log(i);

obj=s;
console.log(obj);

var a=["a","b",""],a2=[],b=["a"];
var colSql="";
a.push(obj.aa)
console.log(a)
a.forEach((e,i,a)=>{
	
	if(e!=undefined && e!="") // Skip blanks and undefined
		{
			a2.push(e)
		} 
		})
colSql=a2.join(",")		
console.log(b); */



