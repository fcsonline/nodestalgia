var program = require('commander');
var path = require('path');

program
.version('0.1')
.option('-D, --no-dns', 'Do not resolve DNS')
.option('-e, --speed <speed>', 'Set the request movement speed', Number, 15)
.option('-f, --framerate <framerate>', 'Set the rendering canvas frame rate', Number, 30)
.option('-T, --no-time', 'Do not show date and time')
.option('-C, --no-colorize', 'Do not colorize the requests')
.option('-S, --no-sumarize', 'Do not show the sumarize counters')
.parse(process.argv);

var filename = [];
if (program.args.length  > 0){
  for (i = 0; i < program.args.length; i++) {
    f = program.args[i];
    if (!path.existsSync(f)){
      throw(f + ' does not exists');
    } else {
      filename.push(f);
    }
  }
} else {
  filename.push("/var/log/apache2/access.log");
}

var express   = require('express'),
sys       = require('util'),
dns       = require('dns'),
events    = require('events'),
socketio  = require('socket.io');

var app = module.exports = express.createServer();

// Configuration
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set('view options', { layout: false });
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(require('stylus').middleware({ src: __dirname + '/public' }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes / Controllers
[''].map(function(controllerName) { // Examples: ['api', 'authorization', 'users', 'tests']
  if (controllerName === '') {
    controllerName = 'index'; // Default controller
  }
  var controller = require('./routes/' + controllerName);
  controller.setup(app, program);
});

app.listen(8081);
io = socketio.listen(app);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

var spawn = require('child_process').spawn;
var tail = spawn('tail', ['-f'].concat(filename));

// 127.0.0.1 - - [07/Mar/2012:23:21:47 +0100] "GET / HTTP/1.0" 200 454 "-" "ApacheBench/2.3"
var regexp = /([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+).+\[(.+)\] "(\w+) ([^ ]+) .*" (\w+) (\w+)/;

// Regex for fake dns
var regexpdns = /(fakedns=([0-9\.]+))/;

// Hashmap for DNS resolves
var hmdns = {};

// For DNS resolve
function reverse_addr(addr) {
  var e = new events.EventEmitter();
  dns.reverse(addr, function(err, domains) {
    if (err) {
      if (err.errno == dns.NOTFOUND){
        e.emit('response', addr, 'NOTFOUND');
      }else{
        e.emit('error', addr, err);
      }
    } else{
      e.emit('response', addr, domains);
    }
  });
  return e;
}

tail.stdout.on('data', function (data) {
  var str = data.toString('utf8');
  var match = regexp.exec(str);

  if (match !== null) {
    var robj = {ip: match[1], time: match[2], method: match[3], path: match[4], result: match[5], size: match[6]};

    // Test for matching a GET parameter for DNS faking
    var matchdns = regexpdns.exec(robj.path);
    if (matchdns !== null) {
      robj.ip = matchdns[2];
      robj.path = match[4].replace(regexpdns,''); // Hide fakedns
      console.log('Fake ip: ' + robj.ip);
    }

    if (!program.dns) {
      io.sockets.emit('log', JSON.stringify(robj));
    } else if (hmdns[robj.ip] !== undefined) {
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
