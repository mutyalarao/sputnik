var OrientDB = require('orientjs');

var server = OrientDB({
  host: 'localhost',
  port: 2424,
  username: 'root',
  password: 'root'
});

server.list()
.then(function (dbs) {
  console.log('There are ' + dbs.length + ' databases on the server.');
  // CLOSE THE CONNECTION AT THE END
server.close();
});

