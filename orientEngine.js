var orientdb=require('orientjs');

var server = orientdb({
  host: 'localhost',
  port: 2424,
  username: 'root',
  password: 'root'
});

server.list()
.then(function (dbs) {
  console.log('There are ' + dbs.length + ' databases on the server.');
  //resolve(this);
  //return;
});

console.log("i will wait");

server.create({
  name: 'mydb1',
  type: 'graph',
  storage: 'plocal'
})
.then(function (db) {
  console.log('Created a database called ' + db.name);
});