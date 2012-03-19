
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index.jade', { speedx:'10', speedy:'0', colorize: 'false' });
};
