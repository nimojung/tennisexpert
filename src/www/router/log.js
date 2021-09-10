module.exports = function(app, fs)
{
	// 로그 조회를 위한 부분(보안, 방화벽, 사용내역 등 로그)
	app.get('/log/sample',function(req,res){
		if(req.session.login != "1"){res.redirect('/login?refer_url=' + req.originalUrl); return;}
		
		// 내용
		var fs = require('fs');
		var sleep = require('sleep');
		var data = {};
		var result = [];
		var invar = 0, timecount = 0;
		const TIMEOUT = 10, SLEEPTIME = 100;
		var iamdone = false;

		var path = '/home';
		fs.readdir(path, function(err, items){
			var total = 0, cnt = 0;
			for(var i=0; i<items.length; i++){
				var file = path + '/' + items[i];
				// for문 위에서 items.length를 바로 사용하면 total값이 0이 된다.
				total++;
				fs.stat(file, function(err, stats){
					var size = stats['size'];
					var filename = path + '/' + items[cnt];
					cnt++;
					result.push({filename:filename, size: size});
					console.log('file stat : ' + filename + ' total : ' + total + ' size : ' + size);
					if((total > 0) && (cnt > 0) && (total = cnt)){
						data["length"] = total;
						data["data"] = result;
						iamdone = true;
					}
				});
			}
		});

		var checkdone = function(){
			// 모든 처리가 정상적이면 클라이언트로 응답값을 보낸다.
			// 이때, 타임아웃(timeout)를 미리 설정하여, 그 전에 처리하지 못하면 fail를 응답값으로 보내자.
			if(iamdone){
				console.log('It\'s Done!!!');
				data["title"] = 'Chart Sample'; data["success"] = 1; data["msg"] = "";
				console.log('Data: ' + data);
				res.render('log/sample', data);
				clearInterval(invar);
			}else{
				console.log('Not yet!!!');
				timecount++;
				if(timecount > TIMEOUT){
					data["title"] = 'Chart Sample'; data["success"] = 0; data["msg"] = "timeout";
					res.render('log/sample', data);
					clearInterval(invar);
				}
			}
		}
		// 비동기처리를 동기처럼 하기 위해서, 순차적으로나 처리해야 할 함수가 완료되었는지 주기적으로 확인하는 방식으로 구현해봄.
		invar = setInterval(checkdone, SLEEPTIME);
	});
	
	/*
	 *  실시간 로그 부분 
	 *  flag = view (html rendering), search (log 조회)	 *  
	 */	
	app.get('/log/realtime', function(req, res){
		if(req.session.login != "1"){res.redirect('/login?refer_url=' + req.originalUrl); return;}
		
		var flag = req.query.flag;
		var type = req.query.type;
		if(flag == "view"){
			var title = "";
			if(type == "firewall"){
				title = "방화벽";
				res.render('log/realtime', {title:title, type:type, menuid: 2});
			}else if(type == "ips"){
				title = "침입탐지";
				res.render('log/realtime', {title:title, type:type, menuid: 2});
			}else if(type == "abnormal"){
				title = "이상징후";
				res.render('log/realtime', {title:title, type:type, menuid: 2});
			}else{
				res.send("Invalid Request!!!");
			}
		}else if(flag == "search"){
			var data = [];
			if(type == "firewall"){
				var filename = "/home/cnbis/data/kern.txt";
				var fs = require('fs');
				var lines = fs.readFileSync(filename, 'utf-8').split('\n');
				for(var i=0; i<lines.length; i++){
					var line = lines[i].split('\t');
					//  rdate, action, nic_in, nic_out, src_ip, dst_ip, len, tos, prec, ttl, id, proto, src_port, dst_portwindow, res, urpg
					if(line.length > 16){
						var values = {};
						values["rdate"] = line[0];
						values["action"] = line[1];
						values["nic_in"] = line[2];
						values["nic_out"] = line[3];
						values["src_ip"] = line[4];
						values["dst_ip"] = line[5];
						values["len"] = line[6];
						values["tos"] = line[7];
						values["prec"] = line[8];
						values["ttl"] = line[9];
						values["id"] = line[10];
						values["proto"] = line[11];
						values["src_port"] = line[12];
						values["dst_port"] = line[13];
						values["window"] = line[14];
						values["res"] = line[15];
						values["urpg"] = line[16];
						data.push(values);
					}else{
						console.log("Invalid Values Length : " + line.length + " Data : " +  lines[i]);
					}
				}
			}else if(type == "ips"){
				var filename = "/home/cnbis/data/eve.txt";
				var fs = require('fs');
				var lines = fs.readFileSync(filename, 'utf-8').split('\n');
				for(var i=0; i<lines.length; i++){
					var line = lines[i].split('\t');
					//  rdate,event_type,src_ip,src_port,dst_ip,dst_port,proto,action_code,gid,sid,rev,signature,category,severity
					if(line.length > 13){
						var values = {};
						values["rdate"] = line[0];
						values["event_type"] = line[1];
						values["src_ip"] = line[2];
						values["src_port"] = line[3];
						values["dst_ip"] = line[4];
						values["dst_port"] = line[5];
						values["proto"] = line[6];
						values["action_code"] = line[7];
						values["gid"] = line[8];
						values["sid"] = line[9];
						values["rev"] = line[10];
						values["signature"] = line[11];
						values["category"] = line[12];
						values["severity"] = line[13];
						data.push(values);
					}else{
						console.log("Invalid Values Length : " + line.length + " Data : " +  lines[i]);
					}
				}
			}else if(type == "abnormal"){
				var filename = "/home/cnbis/data/abnormal.txt";
				var fs = require('fs');
				var lines = fs.readFileSync(filename, 'utf-8').split('\n');
				for(var i=0; i<lines.length; i++){
					var line = lines[i].split('\t');
					// cnt,src_ip,src_port,dst_ip,dst_port,proto,rdate,sdate,edate
					if(line.length > 8){
						var values = {};
						values["rdate"] = line[6];
						values["src_ip"] = line[1];
						values["src_port"] = line[2];
						values["dst_ip"] = line[3];
						values["dst_port"] = line[4];
						values["proto"] = line[5];
						values["cnt"] = line[0];
						values["sdate"] = line[7];
						values["edate"] = line[8];
						data.push(values);
					}else{
						console.log("Invalid Values Length : " + line.length + " Data : " +  lines[i]);
					}
				}
			}else{
				data.push({msg:  "Invalid Request!!!"});
			}
			res.json(data);
		}else{
			res.send("Invalid Request!!!");
		}		
	});
		
	/*
	 *  로그 검색 
	 *  flag = view (html rendering), search (log 조회)	 *  
	 */	
	app.get('/log/search', function(req, res){
		if(req.session.login != "1"){res.redirect('/login?refer_url=' + req.originalUrl); return;}
		
		var flag = req.query.flag;
		var type = req.query.type;
		
		if(flag == "view"){
			var title = "";
			if(type == "firewall"){
				title = "방화벽";
				res.render('log/search', {title:title, type:type, menuid: 2});
			}else if(type == "ips"){
				title = "침입탐지";
				res.render('log/search', {title:title, type:type, menuid: 2});
			}else if(type == "abnormal"){
				title = "이상징후";
				res.render('log/search', {title:title, type:type, menuid: 2});
			}else if(type == "audit"){
				title = "감사";
				res.render('log/search', {title:title, type:type, menuid: 2});
			}else{
				res.send("Invalid Request!!!");
			}
		}else if(flag == "search"){
			var data = [];
			// 넘겨받은 조회조건 값
			var cdata = req.query.cdata;
			var cname = req.query.cname;
			var rday = req.query.rday;
			// 나중을 위한..(페이징처리), 일단 모두 다 가져간다.
			var page = req.query.page;
			var count = req.query.count;
			var offset = (1 - page) * count;		
			// 최대 1024개까지만 가져가게(나중에 바꾸기)
			// 현재는 IP만
			var where = " where rdate like '" + rday + "%'";
			if(cname == "ip"){
				where += " and (src_ip like '" + cdata + "%' or dst_ip like '" + cdata + "%')";
			}else if(cname == "signature"){
				where += " and signature like '%" + cdata + "%'";				
			}else if(cname == "major"){
				where += " and major like '%" + cdata + "%'";				
			}else if(cname == "contents"){
				where += " and contents like '%" + cdata + "%'";				
			}
			var limit = req.query.limit;
			
			if(type == "firewall"){
				var sqlite = require('sqlite3');
				var db = new sqlite.Database('/home/cnbis/data/log.dat');		
				var query = "select rdate, action, nic_in, nic_out, src_ip, src_port, dst_ip, dst_port, len, tos, prec, ttl, id, proto, window, res, urpg, flag from fw_log " + where + " order by rdate desc limit " + limit;
				console.log(query);
				db.serialize(function(){
					db.all(query, function(err, rows){
						console.log('db.all : ', rows.length);
						if(rows.length > 0){
							var cnt = 0;
							rows.forEach((row) => {							
								var values = {};
								values["rdate"] = row.rdate;
								values["action"] = row.action;
								values["nic_in"] = row.nic_in;
								values["nic_out"] = row.nic_out;
								values["src_ip"] = row.src_ip;
								values["dst_ip"] = row.dst_ip;
								values["len"] = row.len;
								values["tos"] = row.tos;
								values["prec"] = row.prec;
								values["ttl"] = row.ttl;
								values["id"] = row.id;
								values["proto"] = row.proto;
								values["src_port"] = row.src_port;
								values["dst_port"] = row.dst_port;
								values["window"] = row.window;
								values["res"] = row.res;
								values["urpg"] = row.urpg;
								data.push(values);
								
								cnt++;
								if(cnt == rows.length){
									res.json(data);
								}
							});
						}else{
							res.json(data);							
						}
					});
				});
				db.close();
			}else if(type == "ips"){
				var sqlite = require('sqlite3');
				var db = new sqlite.Database('/home/cnbis/data/log.dat');
				// 최대 1024개까지만 가져가게(나중에 바꾸기)
				var query = "select rdate, action, src_ip, src_port, dst_ip, dst_port, proto, sid, signature, category from ips_log " + where + " order by rdate desc limit " + limit;
				console.log(query);
				db.serialize(function(){
					db.all(query, function(err, rows){
						console.log('db.all : ', rows.length);
						if(rows.length > 0){
							var cnt = 0;
							rows.forEach((row) => {							
								var values = {};							
								values["rdate"] = row.rdate;
								values["action"] = row.action;
								values["src_ip"] = row.src_ip;
								values["dst_ip"] = row.dst_ip;
								values["src_port"] = row.src_port;
								values["dst_port"] = row.dst_port;
								values["proto"] = row.proto;
								values["sid"] = row.sid;
								values["signature"] = row.signature;
								values["category"] = row.category;					
								data.push(values);
								
								cnt++;
								if(cnt == rows.length){
									res.json(data);
								}
							}); 
						}else{
							res.json(data);											
						}
					});
				});
				db.close();
			}else if(type == "abnormal"){
				var sqlite = require('sqlite3');
				var db = new sqlite.Database('/home/cnbis/data/log.dat');
				// 최대 1024개까지만 가져가게(나중에 바꾸기)
				var query = "select rdate,sdate,edate,cnt,src_ip,src_port,dst_ip,dst_port,proto from abnormal_log " + where + " order by rdate desc limit " + limit;
				console.log(query);
				db.serialize(function(){
					db.all(query, function(err, rows){
						console.log('db.all : ', rows.length);
						if(rows.length > 0){
							var cnt = 0;
							rows.forEach((row) => {							
								var values = {};											
								values["rdate"] = row.rdate;
								values["src_ip"] = row.src_ip;
								values["dst_ip"] = row.dst_ip;
								values["src_port"] = row.src_port;
								values["dst_port"] = row.dst_port;
								values["proto"] = row.proto;
								values["cnt"] = row.cnt;
								values["sdate"] = row.sdate;
								values["edate"] = row.edate;					
								data.push(values);
								
								cnt++;
								if(cnt == rows.length){
									res.json(data);
								}
							});
						}else{
							res.json(data);											
						}
					});
				});
				db.close();
			}else if(type == "audit"){
				// 사용내역
				var sqlite = require('sqlite3');
				var db = new sqlite.Database('/home/cnbis/data/log.dat');
				// 최대 1024개까지만 가져가게(나중에 바꾸기)
				var query = "select rdate,major,minor,contents from audit_log " + where + " order by rdate desc limit " + limit;
				console.log(query);
				db.serialize(function(){
					db.all(query, function(err, rows){
						console.log('db.all : ', rows.length);
						if(rows.length > 0){
							var cnt = 0;
							rows.forEach((row) => {							
								var values = {};											
								values["rdate"] = row.rdate;
								values["major"] = row.major;
								values["minor"] = row.minor;
								values["contents"] = row.contents;			
								data.push(values);
								
								cnt++;
								if(cnt == rows.length){
									res.json(data);
								}
							});
						}else{
							res.json(data);											
						}
					});
				});
				db.close();
			}else{
				data.push({msg:  "Invalid Request!!!"});
			}
		}else{
			res.send("Invalid Request!!!");
		}		
	});
}
