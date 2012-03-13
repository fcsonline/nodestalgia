/**
 *   Nodestalgia websocket & canvas experiment
 *   2012 fcsonline
 */
(function(){

 var PI_2        = Math.PI * 2;
 var MAX_MSG_TTL = 50;

 var canvasW     = 1000;
 var canvasH     = 560;
 var friction    = 0.99;
 var requests    = [];
 var typerequests= {};
 var messages    = [];
 var total       = 0;

 var canvas;
 var ctx;
 var canvasDiv;

 var longDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
 var longMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];


 function init(){
   canvas = $("#mainCanvas")[0];

   if ( canvas.getContext ){
     setup();
     setInterval( run , 33 );
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

   console.log ("Initialize canvas with size: " + canvasW + "x" + canvasH);

   ctx = canvas.getContext("2d");

   // Init label display responses
   typerequests['200'] = 0;
   typerequests['404'] = 0;
   typerequests['304'] = 0;
 }

 function run(){
   ctx.globalCompositeOperation = "source-over";
   ctx.fillStyle = "rgba(8,8,12,0.65)";
   ctx.fillStyle = "rgb(0,0,0)";
   ctx.fillRect( 0 , 0 , canvasW , canvasH );
   ctx.globalCompositeOperation = "lighter";

   var Mrnd = Math.random;
   var Mabs = Math.abs;

   // Obsolete arrays
   var orequests = [];
   var omessages = [];

   var i = requests.length;
   while ( i-- ){
     var m  = requests[i];
     var x  = m.x;
     var y  = m.y;
     var vX = m.vX;
     var vY = m.vY;

     var avgVX = Mabs( vX );
     var avgVY = Mabs( vY );
     var avgV  = ( avgVX + avgVY ) * 0.5;

     if( avgVX < .1 ) vX *= Mrnd() * 3;
     if( avgVY < .1 ) vY *= Mrnd() * 3;

     var sc = avgV * 0.45;
     sc = Math.max( Math.min( sc , 4.5 ) , 0.4 );

     sc = m.size;

     var nextX = x + vX;
     var nextY = y + vY;

     if ( nextX > canvasW ){
       nextX = canvasW;
       vX *= -1;

       // Push a new message
       var msg = new Message();
       msg.x   = nextX - 50;
       msg.y   = nextY;
       msg.color = m.color;
       msg.text  = m.req.result;
       msg.ttl = MAX_MSG_TTL; // Aprox: 1.5s
       messages.push(msg);

       var g = ctx.createRadialGradient(nextX,nextY,m.size,nextX,nextY,m.size*10);
       g.addColorStop(0,"rgba(" + m.color.r + "," + m.color.g + "," + m.color.b + "," + 1 +")");
       g.addColorStop(0.2,"rgba(" + m.color.r + "," + m.color.g + "," + m.color.b + ", 0.4)");
       g.addColorStop(1.0,"rgba(255,255,255,0.1)");

       ctx.save();
       ctx.fillStyle = g;
       //ctx.fillStyle = colorDef(m.color);
       //ctx.scale(3, 0.75); // Elipse
       ctx.beginPath();
       ctx.arc(nextX, nextY, sc*10, 0, PI_2, false);
       ctx.fill();
       ctx.restore();

     } else if ( nextX < 0 ){
       orequests.push(i);
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

     // Reset shadows
     ctx.shadowBlur = 0;

     ctx.fillStyle = colorDef(m.color);
     ctx.beginPath();
     ctx.arc( nextX , nextY , sc , 0 , PI_2 , true );
     ctx.closePath();
     ctx.fill();
   }

   // HTTP Result labels
   var j = messages.length;
   ctx.font = "9pt Arial";
   ctx.shadowColor = "#fff";
   ctx.shadowOffsetX = 0;
   ctx.shadowOffsetY = 0;

   while ( j-- ){
     var msg  = messages[j];

     if (--msg.ttl > 0){
        ctx.fillStyle = colorDef(msg.color, msg.ttl / MAX_MSG_TTL);
        ctx.shadowBlur = msg.ttl / 5;
        ctx.fillText(msg.text, msg.x, msg.y);
     } else {
       omessages.push(j);
     }

   }

   // Type requests and total label
   var st = '';

   st += ' HTTP OK: ' + pad(typerequests['200'], 7);
   st += ' HTTP NOT FOUND: ' + pad(typerequests['404'], 5);
   st += ' HTTP NOT MODIFIED: ' + pad(typerequests['304'], 5);
   st += ' TOTAL: ' + pad(total, 8);

   var x = canvasW - 600;
   var y = canvasH - 5;
   ctx.font = "10pt Arial";
   ctx.shadowBlur = 0;
   ctx.fillStyle = "#ffffff";
   ctx.fillText(st, x, y);

   // Date display
   var date = new Date();
   ctx.fillText(getDateDisplay(date), 5, 15);
   ctx.fillText(getTimeDisplay(date), 5, 35);

   // Remove obsolete requests & messages
   requests = $.grep(requests, function(n, i){
      return $.inArray(i, orequests);
   });

   messages = $.grep(messages, function(n, i){
      return $.inArray(i, omessages);
   });

 }

 function RemoteRequest(){
   this.color = {r: Math.floor( Math.random()*155 + 100 ), g: Math.floor( Math.random()*155 + 100 ), b: Math.floor( Math.random()*155 + 100 )};
   this.x     = 0;
   this.y     = 0;
   this.vX    = 0;
   this.vY    = 0;
   this.size  = 5;
   this.req   = null; // Filled by websocket
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

     var i = requests.length;
     var m = new RemoteRequest();
     m.x   = 0; // canvasW * 0.5;
     m.y   = Math.floor( Math.random() * (canvasH - 30) + 30 ); // canvasH * 0.5;
     m.vX  = Math.random() * 50 + 10;
     m.vY  = 0; //Math.sin(i) * Math.random() * 34;
     m.req = robj;
     requests.push(m);

     ++total;
 });

})();
