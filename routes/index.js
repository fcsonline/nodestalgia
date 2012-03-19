
/*
 * GET home page.
 */

exports.setup = function(app, program) {
  app.get('/', function(req, res) {
    res.render('index.jade', { 
      speedx: program['speedx'], 
      speedy: program['speedy'], 
      colorize: '' + program.colorize, 
      sumarize: '' + program.sumarize, 
      time: '' + program.time
    });
  });
};
