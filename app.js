var app = require('express').createServer()
var io = require('socket.io').listen(app);
var path = require('path');

if (process.argv[2] != undefined){
   filename = process.argv[2];
   if (!path.existsSync(filename)){
      throw(filename + ' does not exists');
   }
} else {
  filename = '/var/log/apache2/access.log'
}

app.get('/', function(req, res) {
  res.sendfile(__dirname + '/index.html');
});

app.get('/reqscanvas.js', function(req, res) {
  res.sendfile(__dirname + '/reqscanvas.js');
});

app.get('/json2.js', function(req, res) {
  res.sendfile(__dirname + '/json2.js');
});

console.info('Server running at http://127.0.0.1:8081/ and following "' + filename + '"');
app.listen('8081');


var spawn = require('child_process').spawn;
var tail = spawn('tail', ['-f', filename]);

// 127.0.0.1 - - [07/Mar/2012:23:21:47 +0100] "GET / HTTP/1.0" 200 454 "-" "ApacheBench/2.3"
var regexp = /([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+).+\[(.+)\] "(\w+) ([^ ]+) .*" (\w+) (\w+)/g;

tail.stdout.on('data', function (data) {
  var str = data.toString('utf8');
  var match = regexp.exec(str);

  if (match !== null) {
    var robj = {ip: match[1], time: match[2], method: match[3], path: match[4], result: match[5], size: match[6]};
    io.sockets.emit('log', JSON.stringify(robj));
  }
});
