module.exports = function(app, fs)
{
	app.get('/',function(req,res){
		var ip = getUserIP(req);
		if(ip == "127.0.0.1"){
			// localhost에서 접속하면 로그인한 것으로 하자.
			req.session.login = '1';
		}else{
			if(req.session.login != "1"){res.redirect('/login?refer_url=' + req.originalUrl); return;}
		}
		
		res.render('index', {
			title: "Cnbis Automotive Network Security Gateway",
			menuid: 1
		})
	});
	
	// only view(conver html to ejs)
	app.get('/config/passwd', function(req, res){
		if(req.session.login != "1"){res.redirect('/login?refer_url=' + req.originalUrl); return;}
		
		// abs path : /home/pi/test/views/config/firewall.ejs
		res.render('config/passwd', {menuid:3});
	});
	
	function getUserIP(req){
	    var ipAddress;

	    var forwardedIpsStr = req.header('x-forwarded-for');

        if(forwardedIpsStr){
            var forwardedIps = forwardedIpsStr.split(',');
            ipAddress = forwardedIps[0];
        }
        if(!ipAddress){
            ipAddress = req.connection.remoteAddress;
        }
	    return ipAddress;
	}


	function genHash(source, key){
		var result = "";
		var crypto = require('crypto');
		var hmac = crypto.createHmac('sha256', key);
		
		hmac.on('readable', () => {
			var data = hmac.read();
			if(data){
				result = data.toString('hex');
			}
		});


		hmac.write(source);
		hmac.end();

		return result;
	}


	app.post('/config/passwd/check', function(req,res){
		var sqlite = require("better-sqlite3");
		var db = new sqlite("/home/cnbis/data/config.dat");
		var db_pw = new sqlite("/home/cnbis/data/log.dat");

		var result = {};

		var now_pw = req.body.now_pw;
		var new_pw = req.body.new_pw;

		console.log('now_pw=>'+now_pw);

		var key = 'cnbis123!@#';
			var now_pw_target = genHash(now_pw, key);//현재 비밀번호 해쉬값 
			var new_pw_target = genHash(new_pw, key);//새 비밀번호 해쉬값

			console.log('now_pw_target_hash: ', now_pw_target);
			console.log('new_pw_target_hash: ', new_pw_target);

			console.log("now_pw?"+now_pw); //현재 비밀번호
			console.log("new_pw?"+new_pw); //새 비밀번호 

			query = "select count(1) as cnt from login where pw = '" + now_pw_target + "'";

			var now_pw_data = db.prepare(query).all();
			console.log("현재 비밀번호 =>"+query);
			console.log("현재 비밀번호 결과 =>"+now_pw_data[0].cnt);
			console.log(now_pw_data);

			if(now_pw_data[0].cnt == 1){ //현재 비밀번호를 못찾으면 0 , 현재 비밀번호를 찾으면 1
				var update_pw_query = "update login set pw ='" + new_pw_target +"'" + "where pw = '" + now_pw_target + "'";
				var new_pw_data = db.prepare(update_pw_query).run();

				console.log("새 비밀번호 =>"+update_pw_query);
				console.log("새 비밀번호 결과 =>"+new_pw_data);
				console.log(new_pw_data);

				//비밀번호 변경 감사로그
				var major = "비밀번호 변경";
				var minor ='성공';
				var contents = "성공";
				query_pw = "insert into audit_log (rdate, major, minor, contents) values (strftime ('%Y-%m-%d %H:%M:%S' , 'now', 'localtime'),'" +  major  +   "','"   +  minor  +  "','"   + contents + "')";
				var time_test = db_pw.prepare(query_pw).run();
				console.log('');
				console.log(time_test);


				result["result"] = 1;
				
			}else{
				//실패
				console.log('현재 패스워드 아닐경우   =>'  + now_pw_data.pw);
				console.log(now_pw_data);
				result["result"] = 0;
			}
			res.json(result); 

		});



	app.get('/login',function(req,res){
		var refer_url = req.query.refer_url;
		// 이전 주소를 받아서 넘겨주기
		res.render('login', {title: "Login", refer_url:refer_url});
	});

	// login logic(action), send to json
	app.post('/login_check',function(req,res){		
		var sqlite = require("better-sqlite3");
		var db = new sqlite("/home/cnbis/data/config.dat")
		var pw = req.body.pw;

		console.log('pw=>'+pw);

		var failCount = req.body.failCount;
		var result = {};

		var key = 'cnbis123!@#';
		// sha256 
		var target = genHash(pw, key);
		console.log('hash: ', target);

		/** 시간 셀렉
		* 현재 서버시간을 알아낸다
		**/
		var time_db = new sqlite("/home/cnbis/data/log.dat");
		
		
		try{
			var major = "로그인";//major ->로그인 
			var minor = "", contents = "";//minor -> 성공,실패 contents -> 내용(예:몇회 실패)
			query = "select count(1) as cnt from login where pw = '" + target + "'";

			var data_test = db.prepare(query).get();
			//console.log('3');
			if(data_test.cnt == 1){
				// 로그인 성공
				result["result"] = 1;
				minor ='성공';
				contents = "성공";
				
				req.session.login = '1';
			}else{
				// 비밀번호가 일치 않을 경우, 실패
				result["result"] = 0;
				minor ='실패';
				contents = failCount + "회 실패";
			}

			//insert or replace into <-- 로긴 정보 변경할때 
			//insert into <- 이건 감사로그 할때 
			query2 = "insert into audit_log (rdate, major, minor, contents) values (strftime ('%Y-%m-%d %H:%M:%S' , 'now', 'localtime'),'" +  major  +   "','"   +  minor  +  "','"   + contents + "')";
			var time_test = time_db.prepare(query2).run();


		}catch(e){
			console.log(e);
			// 에러...
			result["result"] = -1; 
		}
		res.json(result); 
	});

	app.get('/log/control', function(req, res){
		// abs path : /home/pi/test/views/config/firewall.ejs
		res.render('log/control', {menuid:2});
	});

	app.post('/log/control/insert', function(req, res){
		var sqlite = require("better-sqlite3");
		var db = new sqlite("/home/cnbis/data/config.dat")
		var test_info_name = req.body.test_info_name;
		var test_info_ip = req.body.test_info_ip;

		// var query_lss = "insert or replace into tb_control_config (id,name,ip,total_count,total_icmp,total_http) values("1","jjj","2","aaa","3","bbb");"

		var query = "insert or replace into tb_control_config (id,name,ip,total_count,total_icmp,total_http) values('"
		+ 1 + "','" + test_info_name +"','" + test_info_ip + "','" + 123456 + "','" + 87765 +"','" + 56452 + "')" ;
		var query_start = db.prepare(query).run();

		console.log('test_info_name 대상 시스템명 => '+test_info_name);
		console.log('test_info_ip aaaa => ' +test_info_ip);
		console.log(query_start);
	});


	// app.post('/log/control', function(req,res){

	//  var sqlite = require("better-sqlite3");
	//  var db = new sqlite("/home/cnbis/data/config.dat");
	//  //var db_pw = new sqlite("/home/cnbis/data/log.dat");

	//  var name_ss = req.body.name_ss;
	//  var ip_ss = req.body.ip_ss;

	//  console.log("aaa");
	// });
	

	// 외부 인프라(Server2 구현을 위한 부분)
	app.get('/gendata',function(req, res){
		var gen = {};
        gen.flag = 0;
        gen.time = 0;
		res.json(values);
	});
}







/*app.get('/log/control', function(req,res){
	console.log("ss")
});*/


