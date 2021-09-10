var express = require('express');
var app = express();

app.use(express.static(__dirname + '/public'));
app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js')); // redirect bootstrap JS
app.use('/js', express.static(__dirname + '/node_modules/bootstrap-table/dist')); // redirect bootstrapTable JS
app.use('/js', express.static(__dirname + '/node_modules/jquery/dist')); // redirect JS jQuery 
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css')); 
app.use('/css', express.static(__dirname + '/node_modules/bootstrap-table/dist'));
app.use('/fonts', express.static(__dirname + '/node_modules/bootstrap/dist/fonts')); // redirect bootstrap Fonts

var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
var fs = require('fs');

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

//로그인
var session = require('express-session');
app.use(session({
	key: 'key_01028137832', // 세션키
	secret: 'secret_01028137832', // 비밀키
	resave: false,
	saveUninitialized: true
}));

// localhost로 설정
var bindip = 'localhost';
var debug = true;
if(debug){
	bindip = '0.0.0.0';
}

//80, 443 열기(sudo 를 해야 low port로 열림, sudo forever index.js)
var http=require('http');
var port1 = 80;  
http.createServer(app).listen(port1, bindip, function(){  
	console.log("Http server listening on port " + port1);
});

var https = require('https');
var port2 = 443;
var options = {
		key: fs.readFileSync('key.pem'),
	    cert: fs.readFileSync('cert.pem')
};
https.createServer(options, app).listen(port2, bindip, function(){  
	  console.log("Https server listening on port " + port2);
});
// 기본(router 변수명은 현재 의미가 없음)
var r1 = require('./router/main')(app, fs);
// 로그
var r2 = require('./router/log')(app, fs);
// 설정
var r3 = require('./router/config')(app, fs);
// 통계
var r4 = require('./router/stats')(app, fs);
// 기타
var r5 = require('./router/etc')(app, fs);
// Packet
var r6 = require('./router/packet')(app, fs);
// Scan
var r7 = require('./router/scan')(app, fs);