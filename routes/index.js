
/*
 * GET home page.
 */

exports.setup = function(app, program) {
  app.get('/', function(req, res) {
    res.render('index.jade', { 
      speed: program.speed, 
      framerate: program.framerate, 
      colorize: '' + program.colorize, 
      sumarize: '' + program.sumarize, 
      time: '' + program.time
    });
  });
};
