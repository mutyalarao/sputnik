//

var oracledb = require('oracledb');  
var async = require('async');
  
oracledb.getConnection({  
     user: "SYSADM",  
     password: "SYSADM",  
     connectString: "HR92U013"  
}, function(err, connection) {  
     if (err) {  
          console.error(err.message);  
          return;  
     }  
     connection.execute( "SELECT RECNAME,DESCRLONG,LASTUPDDTTM FROM psrecdefn",  
     [],  
     function(err, result) {  
          if (err) {  
               console.error(err.message);  
               doRelease(connection);  
               return;  
          }  
          console.log(result.metaData);  
          console.log(result.rows);  
          doRelease(connection);  
     });  
});  
  
