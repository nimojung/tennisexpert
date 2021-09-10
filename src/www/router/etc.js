module.exports = function(app, fs)
{
	// 기타(자주 사용을 금지) 위한 부분
	
	// 시스템 정보(cpu, memory, disk) 내용 조회 부분
	app.get('/etc/system_info',function(req,res){
		if(req.session.login != "1"){res.redirect('/login?refer_url=' + req.originalUrl); return;}
		
		// 내용
		var shell = require('shelljs');
		var os = require('os');
		var data = [];		
		var values = {};
		
		var cpus = os.cpus();
		var cpu_usage = 0;
		var cpu_count = 0;
		cpus.forEach(function(json){
			var cpu_use = json.times.user + json.times.nice + json.times.sys;
			var cpu_idle = json.times.idle;
			cpu_usage += Math.ceil(cpu_use / (cpu_use + cpu_idle) * 100);
			cpu_count += 1;			
		});
		 values["cpu"] = Math.ceil(cpu_usage / cpu_count);
		 values["cpu_total"] = "100";
		 values["cpu_count"] = cpu_count;
			 
		 values["memory"] = os.freemem();
		 values["memory_total"] = os.totalmem();
		 
		 values["home"] =  os.homedir();		
		 values["arch"] =  os.arch();
		 
		 shell.exec('df -h', function(code, stdout, stderr){
			 var disk = 0, hdd_total = 0;
			 var list = stdout.split("\n");
			 list.forEach(function(temp){
				 // % 앞 3자리까지(그래야 %를 가져올 수 있음)
				 // home만 가져오기
				 if(temp.indexOf("/home") > -1){
					 var tab = temp.substring(temp.indexOf("%") - 3);
					 var sublist = tab.split("%");
					 disk = sublist[0];
					 // hdd total(size)
					 hdd_total = temp.substr(temp.indexOf(" ")).trim().split(" ")[0];
				 }else if(temp.substr(-1) == "/"){
					 var tab = temp.substring(temp.indexOf("%") - 3);
					 var sublist = tab.split("%");
					 disk = sublist[0];
					 // hdd total(size)
					 hdd_total = temp.substr(temp.indexOf(" ")).trim().split(" ")[0];
				 }
			 });
			 // callback에서 보낸다(마지막 로직이므로 가능).
			 values["disk"] = disk;
			 values["disk_total"] = "100";
			 if(hdd_total.indexOf("G") > 0){
				 hdd_total = hdd_total.replace("G", " GB"); 
			 }else if(hdd_total.indexOf("M") > 0){
				 hdd_total = hdd_total.replace("M", " MB"); 
			 }
			 values["hdd_total"] = hdd_total;
			 
			data.push(values);		
			res.json(data);
		 });
	});
	
	app.get('/etc/history', function(req,res){
		if(req.session.login != "1"){res.redirect('/login?refer_url=' + req.originalUrl); return;}
		
		// 사용내역
		var sqlite = require('sqlite3');
		var db = new sqlite.Database('/home/cnbis/data/log.dat');
		var limit = "6";
		var data = [];
		// 최대 1024개까지만 가져가게(나중에 바꾸기)
		var query = "select rdate,major,minor,contents from audit_log order by rdate desc limit " + limit;
		db.serialize(function(){
			db.all(query, function(err, rows){
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
	});
	
	app.get('/etc/statistics', function(req,res){
		if(req.session.login != "1"){res.redirect('/login?refer_url=' + req.originalUrl); return;}
		
		// 통계
		var sqlite = require('sqlite3');
		var db = new sqlite.Database('/home/cnbis/data/log.dat');
		var values = {};		
		values["firewall"] = 0;
		values["ips"] = 0;
		values["abnormal"] = 0;
		var period = "-1 month";
		
		var query = "select count(1) as cnt, 1 as flag  from fw_log where rdate > datetime('now', 'localtime', '" + period + "')"
		query += " union all ";
		query += "select count(1) as cnt, 2 as flag from ips_log where rdate > datetime('now', 'localtime', '" + period + "')";
		query += " union all ";
		query += "select count(1) as cnt, 3 as flag from abnormal_log where rdate > datetime('now', 'localtime', '" + period + "')";
		
		db.serialize(function(){
			db.all(query, function(err, rows){
				if(rows.length > 0){					
					rows.forEach((row) => {	
						if(row.flag == 1){
							values["firewall"] = row.cnt;
						}else if(row.flag == 2){
							values["ips"] = row.cnt;							
						}else if(row.flag == 3){
							values["abnormal"] = row.cnt;							
						}						
					});
					res.json(values);				
				}else{
					res.json(values);											
				}
			});
		});
		db.close();	
	});
	

	app.get('/etc/status', function(req,res){
		if(req.session.login != "1"){res.redirect('/login?refer_url=' + req.originalUrl); return;}
		
		// 보안 상태(기본 정보 및 보안의 상태)
		function checkrule(){
			return new Promise(function(resolve, reject){
				var values = {};		
				values["firewall_count"] = 0;
				values["ips_count"] = 0;
				values["abnormal_count"] = 0;
				// 3(1, 2, 3) 단계로 구성 (양호, 경고, 위험)
				values["level"] = 0;
				values["detect_count"] = 0;
				values["ips_status"] = 0;
				
				//  패턴(룰) 정보 조회 부분
				var sqlite = require('sqlite3');
				var db = new sqlite.Database('/home/cnbis/data/rule.dat');
				
				var query = "select count(1) as cnt, 1 as flag  from fw_rule where yn_used = 1";
				query += " union all ";
				query += "select count(1) as cnt, 2 as flag from ips_rule where yn_used = 1";
				query += " union all ";
				query += "select count(1) as cnt, 3 as flag from abnormal_rule where yn_used = 1";
				
				db.serialize(function(){
					db.all(query, function(err, rows){
						if(err){
							reject('err');
						}
						if(rows.length > 0){					
							rows.forEach((row) => {	
								if(row.flag == 1){
									values["firewall_count"] = row.cnt;
								}else if(row.flag == 2){
									values["ips_count"] = row.cnt;							
								}else if(row.flag == 3){
									values["abnormal_count"] = row.cnt;							
								}						
							});	
							resolve(values);
						}else{
							resolve(values);
						}
					});
				});		
				db.close();			
			});
		}
		
		function checkrunning(values){
			return new Promise(function(resolve, reject){
				// 보안 상태값 조회
				var shell = require('shelljs');		
				var cmd = '/home/cnbis/bin/cnbis_ips status';			
				shell.exec(cmd, function(code, stdout, stderr){
					 var list = stdout.split("\n");
					 var running = false;
					 list.forEach(function(temp){
						 if(temp.indexOf("running") > 0){
							 running = true;
						 }
					 });
					 if(running){
					 	values["level"] = 1;
						values["ips_status"] = 1;
					 }else{
						 values["level"] = 2
						values["ips_status"] = 0;;
					 }
					resolve(values);
				});
			});
		}
		
		function checklog(values){
			return new Promise(function(resolve, reject){
				 // 엔진이 죽어 있으면, 경고나 위험(하루전 로그가 있다면 위험) 이상으로 처리한다.
				var sqlite = require('sqlite3');
				 var log_db = new sqlite.Database('/home/cnbis/data/log.dat');
				var period = "-1 day";
				query = "select count(1) as cnt, 1 as flag  from fw_log where rdate > datetime('now', 'localtime', '" + period + "')"
				query += " union all ";
				query += "select count(1) as cnt, 2 as flag from ips_log where rdate > datetime('now', 'localtime', '" + period + "')";
				query += " union all ";
				query += "select count(1) as cnt, 3 as flag from abnormal_log where rdate > datetime('now', 'localtime', '" + period + "')";
				log_db.serialize(function(){
					var cnt = 0;
					log_db.all(query, function(err, rows){
						if(err){
							reject('err');
						}
						if(rows.length > 0){					
							rows.forEach((row) => {
								cnt +=  row.cnt;
							});
							values["detect_count"] = cnt; 
							if(cnt > 0){
								values["level"]++;
							}
							resolve(values);
						}else{
							resolve(values);	
						}
					});
				});							
				log_db.close();	
			});
		}
		
		checkrule()
		.then(checkrunning)
		.then(checklog)
		.then(values => {
			res.json(values);
		});
	});
	
	app.get('/etc/gettime', function(req,res){
		if(req.session.login != "1"){res.redirect('/login?refer_url=' + req.originalUrl); return;}
		
		var now = new Date();
		var values = {};
		values["time"] = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0,19);
		res.json(values);
	});
	
	// 로그아웃
	app.get('/logout', function(req, res){
		sess = req.session;
		if(sess.login){
			// 세션 삭제
			req.session.destroy(function(err){
				if(err){
					console.log(err);
				}else{
					// 로그아웃(세션 종료 시키기등) 행위를 한다음..
					res.redirect('/login');					
				}
			})
		}else{
			// 로그아웃(세션 종료 시키기등) 행위를 한다음..
			res.redirect('/login');
		}
	});
	
	// 개발자 설정
	app.get('/etc/expert', function(req, res){
		if(req.session.login != "1"){res.redirect('/login?refer_url=' + req.originalUrl); return;}
		
		res.render('etc/expert', {title: "개발자 설정", menuid: 4})		
	});
	
	// ssh 접속 설정
	app.get('/etc/ssh', function(req, res){
		if(req.session.login != "1"){res.redirect('/login?refer_url=' + req.originalUrl); return;}
		
		var flag = req.query.flag;
		
		if((flag == "start") || (flag == "stop")){
			var shell = require('shelljs');
			var values = {};
			
			var cmd = '/home/cnbis/bin/cnbis_sys ssh start';
			if(flag == "stop"){
				cmd = '/home/cnbis/bin/cnbis_sys ssh stop';
			}
			
			shell.exec(cmd, function(code, stdout, stderr){
				 if(code == 0){
					 values["success"] = "1";
					 values["msg"] = stdout;
				 }else{
					 values["success"] = "0";
					 values["msg"] = stderr;
				 }		
				res.json(values);
			 });			
		}else if(flag == "status"){
			var shell = require('shelljs');
			var values = {};
			
			var cmd = '/home/cnbis/bin/cnbis_sys ssh status';
			
			values["success"] = "0"; // 최초 실패 설정			
			shell.exec(cmd, function(code, stdout, stderr){
				values["success"] = "1";
				 values["code"] = code;
				 values["running"] = "0";
				 var list = stdout.split("\n");
				 var running = false;
				 list.forEach(function(temp){
					 if(temp.indexOf("running") > 0){
						 values["running"] = "1";				
					 }else if(temp.indexOf("dead") > 0){
						 values["running"] = "0";				
					 }
				 });
				res.json(values);
			 });			
		}else{
			res.send("Invalide Request!!!");
		}
	});
}
