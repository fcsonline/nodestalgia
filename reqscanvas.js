/**
 *   Liquid particles canvas experiment
 *   ©2010 spielzeugz.de 
 */
(function(){

 var PI_2        = Math.PI * 2;

 var canvasW     = 1000;
 var canvasH     = 560;
 var friction    = 0.99;
 var requests    = [];
 var total       = 0;

 var canvas;
 var ctx;
 var canvasDiv;

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
 }

 function run(){
   ctx.globalCompositeOperation = "source-over";
   ctx.fillStyle = "rgba(8,8,12,0.65)";
   ctx.fillStyle = "rgb(0,0,0)";
   ctx.fillRect( 0 , 0 , canvasW , canvasH );
   ctx.globalCompositeOperation = "lighter";

   var Mrnd = Math.random;
   var Mabs = Math.abs;

   var orequests = [];
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
     } else if ( nextX < 0 ){
       orequests.push(i);
       // nextX = 0;
       // vX *= -1;
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

     ctx.fillStyle = m.color;
     ctx.beginPath();
     ctx.arc( nextX , nextY , sc , 0 , PI_2 , true );
     ctx.closePath();
     ctx.fill();
   }

    var x = canvasW - 60;
    var y = canvasH - 5;
    ctx.font = "10pt Arial";
    ctx.fillStyle = "#ffffff"; // text color
    ctx.fillText(pad(total, 8), x, y);

   // Remove obsolete requests
   requests = $.grep(requests, function(n, i){
      return $.inArray(i, orequests);
   });

 }

 function RemoteRequest(){
   this.color = "rgb(" + Math.floor( Math.random()*155 + 100 ) + "," + Math.floor( Math.random()*155 + 100 ) + "," + Math.floor( Math.random()*155 + 100 ) + ")";
   this.x     = 0;
   this.y     = 0;
   this.vX    = 0;
   this.vY    = 0;
   this.size  = 5;
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

 window.onload = init;

 // Establish the websocket connection
 var socket = io.connect('localhost', {port:8081});
 socket.on('log', function (data) {
     var robj = JSON.parse(data);
     console.log(robj);

     var i = requests.length;
     var m = new RemoteRequest();
     m.x   = 0; // canvasW * 0.5;
     m.y   = Math.floor( Math.random() * (canvasH - 30) + 30 ); // canvasH * 0.5;
     m.vX  = Math.random() * 50 + 10;
     m.vY  = 0; //Math.sin(i) * Math.random() * 34;
     requests.push(m);

     ++total;
 });

})();
