/**
 *   Nodestalgia websocket & canvas experiment
 *   2012 fcsonline
 */
(function(){

 var PI_2        = Math.PI * 2;
 var MAX_MSG_TTL = 50;
 var MARGIN_LEFT = 150;
 var MARGIN_RIGHT = 150;
 var MARGIN_TOP     = 50;
 var MARGIN_BOTTOM  = 50;
 var DEFAULT_FONT= "10pt Arial";

 var canvasW     = 1000;
 var canvasH     = 560;
 var friction    = 0.99;
 var requests    = [];
 var typerequests= {};
 var messages    = [];
 var srcslots    = [];
 var dstslots    = [];
 var origins     = [];
 var total       = 0;

 var canvas;
 var ctx;
 var canvasDiv;

 var longDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
 var longMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

 var intervalId = null;
 var intervalLoopTime = 30;

 var speed = 0;
 var sumarize = true;
 var colorize = true;
 var time = true;

 function init(){
   $canvas = $("#mainCanvas");
   canvas = $canvas[0];

   // Load dynamic properties
   intervalLoopTime = $canvas.data("frame-rate");
   speed            = $canvas.data("speed");
   colorize         = $canvas.data("colorize");
   sumarize         = $canvas.data("sumarize");
   time             = $canvas.data("time");

   if ( canvas.getContext ){
     setup();
     resetcounters();
     intervalId = setInterval( run , intervalLoopTime );
   }
   else{
     alert("Sorry, needs a recent version of Chrome, Firefox, Opera, Safari, or Internet Explorer 9.");
   }
 }

 function setup(){
   canvasDiv = $("#canvasContainer")[0];

   canvasW = canvasDiv.offsetWidth;
   canvasH = canvasDiv.offsetHeight;

   canvas.setAttribute("width", canvasW);
   canvas.setAttribute("height", canvasH);

   console.log ("Initialized canvas with size: " + canvasW + "x" + canvasH);
   console.log ("Initialized " + Math.floor(canvasH/20) + " request and resource vertical slots");

   ctx = canvas.getContext("2d");
 }

 function resetcounters(){
   // Init label display responses
   typerequests['200'] = 0;
   typerequests['404'] = 0;
   typerequests['304'] = 0;
 }

 function run(){
   ctx.globalCompositeOperation = "source-over";
   ctx.fillStyle = "rgb(0,0,0)";
   ctx.fillRect( 0 , 0 , canvasW , canvasH );
   ctx.font = DEFAULT_FONT;
   ctx.globalCompositeOperation = "lighter";

   var Mrnd = Math.random;
   var Mabs = Math.abs;

   // Obsolete arrays
   var orequests = [];
   var omessages = [];
   var osrcslots = [];
   var odstslots = [];

   var i = requests.length;
   while ( i-- ){
     var m  = requests[i];
     var x  = m.x;
     var y  = m.y;
     var vX = m.vX;
     var vY = m.vY;
     var sc = m.size;

     var nextX = x + vX;
     var nextY = y + vY;

     if ( nextX > canvasW - MARGIN_RIGHT ){
       nextX = canvasW - MARGIN_RIGHT;
       vX *= -1;

       // Push a new message
       var msg = new Message();
       msg.x   = nextX - 50;
       msg.y   = nextY;
       msg.color = m.color;
       msg.text  = m.req.result;
       msg.ttl = MAX_MSG_TTL; // Aprox: 1.5s
       messages.push(msg);

       var g = ctx.createRadialGradient(nextX,nextY,m.size,nextX,nextY,m.size*20);
       g.addColorStop(0,"rgba(" + m.color.r + "," + m.color.g + "," + m.color.b + "," + 1 +")");
       g.addColorStop(0.2,"rgba(" + m.color.r + "," + m.color.g + "," + m.color.b + ", 0.4)");
       g.addColorStop(1.0,"rgba(255,255,255,0)");

       ctx.save();
       ctx.fillStyle = g;
       ctx.beginPath();
       ctx.arc(nextX, nextY, sc*20, 0, PI_2, false);
       ctx.fill();
       ctx.restore();

       // Search the source slot, for removing
       var dstslotpos = findSlotByTarget(m.req.path);

       dstslots[dstslotpos].count--;
       if (dstslots[dstslotpos].count <= 0) {
          console.log('Removed obsoleted resource slot at: ' + dstslotpos);
          odstslots.push(dstslotpos);
       }

     } else if ( nextX < MARGIN_LEFT ){
       // Remove the request from the stack
       orequests.push(i);

       // Search the request slot, for removing
       var srcslotpos = findSlotByIp(m.req.ip);

       srcslots[srcslotpos].count--;
       if (srcslots[srcslotpos].count <= 0) {
          console.log('Removed obsoleted request slot at: ' + srcslotpos);
          osrcslots.push(srcslotpos);
       }
     }

     if ( nextY > canvasH ){
       nextY = canvasH;
       vY *= -1;
     } else if ( nextY < 0 ){
       nextY = 0;
       vY *= -1;
     }

     m.vX = vX;
     m.vY = vY;
     m.x  = nextX;
     m.y  = nextY;

     ctx.save();
     ctx.fillStyle = colorDef(m.color);
     ctx.beginPath();
     ctx.arc( nextX , nextY , sc , 0 , PI_2 , true );
     ctx.closePath();
     ctx.fill();
     ctx.restore();
   }

   // DNS Source ip label
   var j = srcslots.length;
   ctx.save();
   ctx.font = DEFAULT_FONT;
   ctx.shadowColor = "#fff";
   ctx.shadowOffsetX = 0;
   ctx.shadowOffsetY = 0;
   ctx.shadowBlur = 0;
   ctx.fillStyle = "#ffffff";

   while ( j-- ){
     var s  = srcslots[j];
     ctx.fillText(s.ip, 10, s.y);
   }

   ctx.restore();

   // HTTP Result labels
   var k = messages.length;
   ctx.save();
   ctx.font = DEFAULT_FONT;
   ctx.shadowColor = "#fff";
   ctx.shadowOffsetX = 0;
   ctx.shadowOffsetY = 0;

   while ( k-- ){
     var msg  = messages[k];

     if (--msg.ttl > 0){
        ctx.fillStyle = colorDef(msg.color, msg.ttl / MAX_MSG_TTL);
        ctx.shadowBlur = msg.ttl / 5;
        ctx.fillText(msg.text, msg.x, msg.y);
     } else {
       omessages.push(j);
     }

   }

   ctx.restore();

   // Type requests and total label
   if (sumarize) {
     var st = '';

     st += ' HTTP OK: ' + pad(typerequests['200'], 7);
     st += ' HTTP NOT FOUND: ' + pad(typerequests['404'], 5);
     st += ' HTTP NOT MODIFIED: ' + pad(typerequests['304'], 5);
     st += ' TOTAL: ' + pad(total, 8);

     var x = canvasW - 600;
     var y = canvasH - 5;
     ctx.save();
     ctx.font = DEFAULT_FONT;
     ctx.shadowColor = "#fff";
     ctx.shadowOffsetX = 0;
     ctx.shadowOffsetY = 0;
     ctx.shadowBlur = 0;
     ctx.fillStyle = "#ffffff";
     ctx.fillText(st, x, y);
     ctx.restore();
   }

   // Date & Time display
   if (time) {
     var date = new Date();
     ctx.save();
     ctx.font = DEFAULT_FONT;
     ctx.shadowColor = "#fff";
     ctx.shadowOffsetX = 0;
     ctx.shadowOffsetY = 0;
     ctx.shadowBlur = 0;
     ctx.fillStyle = "#ffffff";
     ctx.fillText(getDateDisplay(date), 5, 15);
     ctx.fillText(getTimeDisplay(date), 5, 35);
     ctx.restore();
   }

   // Remove obsolete requests
   requests = $.grep(requests, function(n, i){
      return $.inArray(i, orequests);
   });

   // Remove obsolete messages
   messages = $.grep(messages, function(n, i){
      return $.inArray(i, omessages);
   });

   // Remove obsolete resources slots
   dstslots = $.grep(dstslots, function(n, i){
      return $.inArray(i, odstslots);
   });

   // Remove obsolete requests slots
   srcslots = $.grep(srcslots, function(n, i){
      return $.inArray(i, osrcslots);
   });

 }

 function RemoteRequest(){
   this.color = ''; // Defined by origin color o random for only one origin
   this.x     = 0;
   this.y     = 0;
   this.vX    = 0;
   this.vY    = 0;
   this.size  = 5;
   this.req   = null; // Filled by websocket
 }

 function Slot(){
   this.x     = 0;
   this.y     = 0;
   this.count = 0;
   this.ip    = ''; // For request slots
   this.path  = ''; // For resource slots
 }

 function Origin(){
   this.color = '';
   this.path  = '';
 }

 function colorDef(obj, alpha){
    if (alpha !== undefined) {
      return "rgba(" + obj.r  + "," + obj.g + "," + obj.b + "," + alpha + ")";
    } else {
      return "rgb(" + obj.r  + "," + obj.g + "," + obj.b + ")";
    }
  }

 function Message(){
   this.x     = 0;
   this.y     = 0;
   this.text  = "";
 }

 function rect( context , x , y , w , h ){
   context.beginPath();
   context.rect( x , y , w , h );
   context.closePath();
   context.fill();
 }

 function pad(num, length) {
   var str = '' + num;
   while (str.length < length) {
     str = '0' + str;
   }

   return str;
 }

 function getDateDisplay(date) {
   return longDays[date.getDay()] + ', ' + longMonths[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear() + '\r\n';
 }

 function getTimeDisplay(date) {
   return (date.getHours() < 10 ? '0' : '') + date.getHours() + ':' +
            (date.getMinutes() < 10 ? '0' : '') + date.getMinutes() + ':' +
            (date.getSeconds() < 10 ? '0' : '') + date.getSeconds();
 }

 function findSlotByIp (ip) {
   for (var j = 0; j < srcslots.length; j++) {
      if (ip === srcslots[j].ip) {
        return j;
      }
   }

   return -1;
 }

 function findSlotByTarget (target) {
   for (var j = 0; j < dstslots.length; j++) {
      if (target === dstslots[j].path) {
        return j;
      }
   }

   return -1;
 }

 function findOriginByName (filename) {
   for (var j = 0; j < origins.length; j++) {
      if (filename === origins[j].path) {
        return j;
      }
   }

   return -1;
 }

 window.onload = init;

 // Establish the websocket connection
 var socket = io.connect('localhost', {port:8081});
 socket.on('log', function (data) {
     var robj = JSON.parse(data);
     // console.log(robj);

     if (typerequests[robj.result] === undefined) {
       typerequests[robj.result] = 0;
     }

     typerequests[robj.result]++;

     // if not paused, then add it to buffer
     if (intervalId) {
       var m = new RemoteRequest();
       m.x   = MARGIN_LEFT; // canvasW * 0.5;
       m.vX  = speed;
       m.req = robj;
       requests.push(m);

       if (robj.origin !== undefined) {
         // Find pre generated origin, for inherit color
         var originpos = findOriginByName(robj.origin);

         if (originpos < 0) {
           // New origin assignment
           var origin = new Origin();
           origin.path = robj.origin;
           origin.color = {r: Math.floor( Math.random()*155 + 100 ), g: Math.floor( Math.random()*155 + 100 ), b: Math.floor( Math.random()*155 + 100 )};
           originpos = origins.push(origin) - 1;
           console.log('New origin: ' + robj.origin);
         }

         m.color = origins[originpos].color;
       } else {
         // For no origin request, only one origin, then random color
         m.color = {r: Math.floor( Math.random()*155 + 100 ), g: Math.floor( Math.random()*155 + 100 ), b: Math.floor( Math.random()*155 + 100 )};
       }

       // Search a request slot
       var srcslotpos = findSlotByIp(robj.ip);

       if (srcslotpos < 0) {
         // New slot assignment
          var slot = new Slot();
          slot.ip = robj.ip;
          slot.count = 1;
          slot.y  = Math.floor( Math.random() * (canvasH - MARGIN_TOP - MARGIN_BOTTOM) + MARGIN_TOP ); // TODO: Find a correct slot vertical position
          srcslotpos = srcslots.push(slot) - 1;
          console.log('New request slot at: ' + slot.y);
       } else {
          srcslots[srcslotpos].count++;
          console.log('Recycled request slot at: ' + srcslots[srcslotpos].y);
       }

       // Search a resource slot
       var dstslotpos = findSlotByTarget(robj.path);

       if (dstslotpos < 0) {
         // New slot assignment
          var slot = new Slot();
          slot.path = robj.path;
          slot.count = 1;
          slot.y  = Math.floor( Math.random() * (canvasH - MARGIN_TOP - MARGIN_BOTTOM) + MARGIN_TOP ); // TODO: Find a correct slot vertical position
          dstslotpos = dstslots.push(slot) - 1;
          console.log('New resource slot at: ' + slot.y);
       } else {
          dstslots[dstslotpos].count++;
          console.log('Recycled resource slot at: ' + dstslots[dstslotpos].y);
       }

       m.y = srcslots[srcslotpos].y;

       // When the origin and target slots are set, then the vertical speed can be calculated
       m.vY = (srcslots[srcslotpos].y - dstslots[dstslotpos].y) * speed / (canvasW - MARGIN_LEFT);
       console.log('New request with vertical speed at: ' + m.vY);

     }

     ++total;
 });

// Pause
$(document).bind('keypress', function(e){
  var unicode=e.keyCode? e.keyCode : e.charCode;

  if (unicode == 32) { // Space - Pause
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    } else {
      intervalId = setInterval( run , intervalLoopTime );
    }
  } else if (unicode == 43){ // + more horizontal speed
    speed = Math.min(speed + 5, 200);
    console.log ("Speed set to: " + speed);
  } else if (unicode == 45){ // - less horizontal speed
    speed = Math.max(speed - 5, 10);
    console.log ("Speed set to: " + speed);
  }
});

// Resize window event
$(window).resize(function() {
  setup();
});

})();
