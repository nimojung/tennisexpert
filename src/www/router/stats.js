module.exports = function(app, fs)
{
	// 통계 쿼리 및 조회를 위한 부분
	app.get('/stats/sample',function(req,res){
		if(req.session.login != "1"){res.redirect('/login?refer_url=' + req.originalUrl); return;}
		
		// 내용
		res.render('stats/sample', {title : "Chart Sample"})
	});
}
