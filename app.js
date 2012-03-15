var sys = require('util');
var dns = require('dns');
var events = require('events');

var app = require('express').createServer()
var io = require('socket.io').listen(app);
var path = require('path');

/* print process.argv
process.argv.forEach(function (val, index, array) {
  console.log(index + ': ' + val);
});
*/

var filename = new Array();
if (process.argv.length > 2){
  for (i=1; i < process.argv.length; i++) {
     f = process.argv[i];
     if (!path.existsSync(f)){
       throw(f + ' does not exists');
     }
    else filename.push(f);
  }
} else {
  filename.push("/var/log/apache2/access.log");
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
var tail = spawn('tail', ['-f'].concat(filename));

// 127.0.0.1 - - [07/Mar/2012:23:21:47 +0100] "GET / HTTP/1.0" 200 454 "-" "ApacheBench/2.3"
var regexp = /([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+).+\[(.+)\] "(\w+) ([^ ]+) .*" (\w+) (\w+)/g;

// Regex for fake dns
var regexpdns = /.*fakedns=(.*)/g;

// Hashmap for DNS resolves
var hmdns = {};

tail.stdout.on('data', function (data) {
  var str = data.toString('utf8');
  var match = regexp.exec(str);

  if (match !== null) {
    var robj = {ip: match[1], time: match[2], method: match[3], path: match[4], result: match[5], size: match[6]};

    // Test for matching a GET parameter for DNS faking
    var matchdns = regexpdns.exec(robj.path);
    if (matchdns !== null) {
      robj.ip = matchdns[1];
      console.log('Fake ip: ' + robj.ip);
    }

    if (hmdns[robj.ip] !== undefined) {
      robj.ip = hmdns[robj.ip];
      io.sockets.emit('log', JSON.stringify(robj));
    } else {
      reverse_addr(robj.ip).addListener('error', function (addr, err) {
        console.log(addr + ' failed: ' + err.message);
      }).addListener('response', function(addr, domains) {
        if (domains.length === 0) {
          hmdns[robj.ip] = robj.ip;
        } else {
          console.log('DNS: ' + addr + ' resolved to ' + domains[0]);
          hmdns[robj.ip] = domains[0];
        }

        // Same that known host
        robj.ip = hmdns[robj.ip];
        io.sockets.emit('log', JSON.stringify(robj));
      });
    }

  }
});

// For DNS resolve
function reverse_addr(addr) {
    var e = new events.EventEmitter();
    dns.reverse(addr, function(err, domains) {
        if (err) {
            if (err.errno == dns.NOTFOUND)
                e.emit('response', addr, 'NOTFOUND');
            else
                e.emit('error', addr, err);
        } else
            e.emit('response', addr, domains);
    });
    return e;
}
