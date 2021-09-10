module.exports = function(app, fs)
{
    //취약성 점검 메뉴 -> 취약성 점검 하기 페이지
    app.get('/scan/control', function(req, res) {
		if(req.session.login != "1"){res.redirect('/login?refer_url=' + req.originalUrl); return;}
		
        // abs path : /home/pi/test/views/config/firewall.ejs
        res.render('scan/control', {
            menuid: 3
        });
    });
    //취약성 점검하기 페이지에서 ip, 이름 insert 하는 부분
    app.post('/scan/control/insert', function(req, res){
        var sqlite = require("better-sqlite3");
        var shell = require('shelljs');
        var db = new sqlite("/home/cnbis/data/config.dat");
        var log_db = new sqlite("/home/cnbis/data/log.dat");
        
        var test_info_name = req.body.test_info_name;
        var test_info_ip = req.body.test_info_ip;
        var status = req.body.status;
        var today = new Date();
        var id = today.toISOString().replace(/[-T:\.Z]/g, "");//today.toISOString().substring(0, 19).replace(/-/gi, "").replace("T", "").replace(/:/gi, "");
        var udate = "strftime ('%Y-%m-%d %H:%M:%S', 'now', 'localtime')";// 년월일시분초
        var flag = "2";
        var rdate = "strftime ('%Y-%m-%d %H:%M:%S', 'now', 'localtime')";
        
        var success = 1;
        var msg = "";

        var major = "취약성점검";
        var minor = "스캔시작";
        var contents = '이름 : ' + test_info_name + ', IP : ' + test_info_ip + ', 상태값 : ' + status;

        
        try{
            // 진행중일 때는 시작하면 안됨.
            // DB 또는 실제 프로세스 확인
            // 실제 확인
            var cmd = "/home/cnbis/bin/scan status";
            shell.exec(cmd, {timeout:1000}, function(code, stdout, stderr){
                // Running
                console.log("code:", code, " stdout:", stdout);
                if(stdout.indexOf("Not") > -1){
                    console.log("Check Point");
                    // 성공 시에만...
                    var query = "insert into tb_control_config (id,ip,name,rdate,udate,flag,status) values('"
                    + id + "','" + test_info_ip +"','" + test_info_name + "'," + rdate + "," + udate +",'" + flag + "','" + status + "')" ;
                    var query_start = db.prepare(query).run(); 

                    var log_insert = "insert into audit_log (rdate, major, minor, contents) values (strftime ('%Y-%m-%d %H:%M:%S' , 'now', 'localtime'),'" + major + "','" + minor + "','" + contents + "')";
                    var log = log_db.prepare(log_insert).run(); //시작 감사로그

                    console.log(query_start);

                    var cmd = "/home/cnbis/bin/scan start " + id; //START 명령어 맞는지?
                    shell.exec(cmd, function(code, stdout, stderr){

                    });
                }else{
                    success = 1;
                    status = "5";
                    msg = "현재 러닝중....";
                    console.log("Check Status : ", status);
                }                
                res.json({id: id, success: success, msg: msg, status: status});
            });            
        }catch(e){
            console.log(e);
            msg = e;
            success = 0;
            res.json({id: id, success: success, msg: msg, status: status});
        }
    });

    app.get('/scan/control/select', function(req, res){
        var id = req.query.id;
        var sqlite = require("better-sqlite3");
        var db = new sqlite("/home/cnbis/data/config.dat");
        var result = {};
        
        try{
            // var query = "select t1.identy, count(1) as cnt, (select count(1) from tb_scan t2 where t2.identy = t1.identy and t2.yn_used = 1 and t2.flag = 2)as cnt2, t2.yn_used from tb_scan t1 where t1.flag = 2 group by t1.identy";
            // var query ="select t1.flag, count(1) as cnt, (select count(1) from tb_scan t2 where t2.flag = t1.flag and t2.yn_used = 1)as cnt2 from tb_scan t1 group by t1.flag";
            var query ="select rdate, udate, id, identy, flag, yn_used from tb_scan";
            var list = db.prepare(query).all();
            res.json(list);
        }catch (e){
            console.log(e);
            res.send(e);
        }
    });


    //취약성 실시간 보기
    app.get('/scan/realtime', function(req, res) {
		if(req.session.login != "1"){res.redirect('/login?refer_url=' + req.originalUrl); return;}
		
        // abs path : /home/pi/test/views/config/firewall.ejs
        var id = req.query.id;
        if((id == undefined) || (id == "")){
            // initial
            var sqlite = require("better-sqlite3");
            var db = new sqlite("/home/cnbis/data/config.dat");
            id = "";
            try{
                var control_query = "select max(id) as id from tb_control_config where flag = 2";
                var result = db.prepare(control_query).all();
                id = result[0].id;
            }catch (e){
                console.log("Error:", e);
            }          
            if(id == null){
                id = "";
            }
        }
        res.render('scan/realtime', {
            menuid: 3,
            id: id
        });
    });
    app.get('/scan/realtime/realtime', function(req, res) {
		if(req.session.login != "1"){res.redirect('/login?refer_url=' + req.originalUrl); return;}
		
        var sqlite = require("better-sqlite3");
        var db = new sqlite("/home/cnbis/data/config.dat");
        var result = {};
        try{
            // var query_column ="id, scanner_name, scanner_ip, web_scanner";
            var query = "select rdate, udate, id, identy, flag, yn_used from tb_scan";
            var list = db.prepare(query).all();

            result["result"] = list;
        }
        catch (e){
            console.log(e);
            result["result"] = e;
        }
        res.json(list);
    });

    app.get('/scan/config/controlconfig', function(req, res) {

        var id = req.query.id;
        var sqlite = require("better-sqlite3");
        var db = new sqlite("/home/cnbis/data/config.dat");

        var query = "select * from tb_control_config where id = '" +id + "'";
        var result = db.prepare(query).all();

        res.json(result);
    });

    app.get('/scan/config/tailfile' , function(req,res) {
        var id = req.query.id;
        var identy_ing = req.query.identy_ing;
        var shell = require('shelljs');
        var cmd = "tail -n128 /tmp/" + id + ".log";
        if(identy_ing == ""){
        	cmd = "tail -n128 /tmp/" + id + ".log";
        }else{
        	cmd = "tail -n128 /tmp/" + id + "." + identy_ing;
        }
        shell.exec(cmd, function(code, stdout, stderr){
            res.send(stdout);
        });
    });    

    //메인화면의 취약성 부분 값 표시 하기
    app.get('/scan/main/info', function(req, res) {
		if(req.session.login != "1"){res.redirect('/login?refer_url=' + req.originalUrl); return;}
		
        var sqlite = require("better-sqlite3");
        var db = new sqlite("/home/cnbis/data/config.dat");
        var result = {};
        var id = req.query.id;
        try{
            if(id > 0){
                var query = "select id, ip, name, rdate, udate, flag, status from tb_control_config where id = " + id + " order by rdate desc";
                var list = db.prepare(query).all();
            }
            else if(id == null){
                query = "select id, ip, name, rdate, udate, flag, status from tb_control_config where flag = '2' order by rdate desc Limit 4";
                list = db.prepare(query).all();
            }
            res.json(list);
        }catch (e){
            console.log(e);
        }
    });
    //여기까지 시뮬레이터 메인화면 조회

    //메인화면 -> 취약성 점검 메뉴 ->최종 결과 보기 눌렀을때 페이지
    app.get('/scan/result', function(req, res) {
		if(req.session.login != "1"){res.redirect('/login?refer_url=' + req.originalUrl); return;}
		
        // abs path : /home/pi/test/views/config/firewall.ejs
        var id = req.query.id;
        res.render('scan/result', {
            menuid: 3, 
            title: '최종 결과보기',
            titleDetail: '최종 결과 보기',
            id:id
        });        
    });
    //결과보기 페이지에서 목록 표시
    app.get('/scan/result/select', function(req, res) {
		if(req.session.login != "1"){res.redirect('/login?refer_url=' + req.originalUrl); return;}
		
        var sqlite = require("better-sqlite3");
        var db = new sqlite("/home/cnbis/data/config.dat");
        var id = req.query.id;
        try{
            if(id > 0){ //데이터가 많을수도 있어서 리미트(256개) 걸어 놓기 2018-09-04 메모 -이승호
                var query = "select id, ip, name, rdate, udate, flag, status from tb_control_config where flag = 2 and id=" + id + " order by rdate desc"; 
                var list = db.prepare(query).all();
            }else if(id == ''){
                query = "select id, ip, name, rdate, udate, flag, status from tb_control_config where flag = 2 order by rdate desc limit 256"; 
                list = db.prepare(query).all();
            }
        }catch (e){
            console.log(e);
        }
        res.json(list);    
    });
    
    // 메인화면 -> 결과 보기 눌렀을때 상세페이지.
    app.get('/scan/detail', function(req, res) {
		if(req.session.login != "1"){res.redirect('/login?refer_url=' + req.originalUrl); return;}
		
        var id = req.query.id;
        res.render('scan/detail', {
            menuid: 3, 
            title: '상세 결과 보기',
            titleDetail: '스캔 상세 결과 보기', 
            id:id
        });
    });
    //상세페이지에서 표시될 값들 가져오기 (기본정보)
    app.get('/scan/detail/slave', function(req, res) {        
		if(req.session.login != "1"){res.redirect('/login?refer_url=' + req.originalUrl); return;}
		
        var sqlite = require("better-sqlite3");
        var db = new sqlite("/home/cnbis/data/config.dat");
        var test_data = {};
        var id = req.query.id;
        try{
            var query = "select id, ip, name, rdate, udate, flag, status" 
            	+ " from tb_control_config where id = " + id + " order by rdate desc";
            // var query = "select t1.id, t1.ip, t1.name, t1.rdate, t1.udate, t1.flag, t1.status from tb_control_config t1, tb_scan t2 where t1.id = " + id + " and t1.id = t2.id order by t1.rdate desc";
            var list = db.prepare(query).all();
        }catch (e){
            console.log(e);
        }
        res.json(list);
    });

    app.get('/scan/detail/slaveList', function(req, res) { 
		if(req.session.login != "1"){res.redirect('/login?refer_url=' + req.originalUrl); return;}
		
        var id = req.query.id;
        var sqlite = require("better-sqlite3");
        var db = new sqlite("/home/cnbis/data/config.dat");
        //scan
        var control_query = "select t1.rdate, t1.udate, t1.status, t1.results, t2.identy, t2.flag" //identy
        + ", Cast((julianday(t1.udate) - julianday(t1.rdate)) * 24 * 3600 As Integer) as time1, Cast((julianday('now', 'localtime') - julianday(t1.rdate)) * 24 * 3600 As Integer) as time2"
        + "  from tb_control_slave t1, tb_scan t2"
        + " where t1.id = '" + id + "' and t1.sub_id = t2.id";

        console.log(control_query);
        var result = db.prepare(control_query).all();

        res.json(result);
    });


    //원본 데이터 보여주기 (stdout 원본 보기 클릭했을때 작동)
    app.get('/scan/detail/slaveList/stdout', function(req, res) { 
        var id = req.query.id;
        var identy_id = req.query.identy_id;
        var sqlite = require("better-sqlite3");
        var db = new sqlite("/home/cnbis/data/config.dat");
        var result = "";
        //scan
        try{
        	var filename = "/tmp/" + id + "." + identy_id;
			var fs = require('fs');
			if(fs.existsSync(filename)){
				result = fs.readFileSync(filename, 'utf-8');
			}else{
                var control_query = "select t1.stdout"
                    + "  from tb_control_slave t1, tb_scan t2"
                    + " where t1.id = '" + id + "' and t1.sub_id = t2.id and t2.identy = '" + identy_id + "'";
                var results = db.prepare(control_query).all();
                if(results.length > 0){
                	result = results[0].stdout;
                }
			}
        }catch (e){
            console.log(e);
        }
        res.send(result);				
    });

  //스캔 설정 시작
    app.get('/config/scan', function(req, res) {
        // abs path : /home/pi/test/views/config/firewall.ejs
        res.render('config/scan', {
            menuid: 4
        });
    });

    // 스캔 설정 상태값 불러오기
    app.get('/config/scan/setting', function(req, res) {
        var sqlite = require("better-sqlite3");
        var db = new sqlite("/home/cnbis/data/config.dat");
        try{
            var query = "select rdate, udate, id, identy, flag, yn_used from tb_scan";
            var result = db.prepare(query).all();
        } catch (e){
            console.log(e);
        }
        res.json(result);
    });

    //스캔 설정값 업데이트
    app.post('/config/scan/setting/status', function(req, res) {
        var sqlite = require("better-sqlite3");
        var db = new sqlite("/home/cnbis/data/config.dat");
        var log_db = new sqlite("/home/cnbis/data/log.dat");
        var index = req.body.index;
        var identy = req.body.identy;
        var udate = "strftime ('%Y-%m-%d %H:%M:%S', 'now', 'localtime')";
        var major = "스캔 설정";
        var minor = "수정";
        var log_msg = "";
        var contents = "";
        var success = "";
        var msg = "";
        //상태값에 따른 감사로그 메세지 지정
        try{
            if(index == 0){
                log_msg = "OFF";
            }
            else{
                log_msg = "ON";
            }
            contents = '스캔명 : ' + identy + ', 사용여부 : ' + log_msg + '설정';
            //상태값 업데이트
            // var query = 'update tb_scan set yn_used = "'+ index + '" where  flag = 2 and identy = "' + identy + '"';
            var query = 'update tb_scan set yn_used = "'+ index + '", udate =' + udate + '  where identy = "' + identy + '"';
            var result = db.prepare(query).run();
            
            var log_insert = "insert into audit_log (rdate, major, minor, contents) values (strftime ('%Y-%m-%d %H:%M:%S' , 'now', 'localtime'),'" + major + "','" + minor + "','" + contents + "')";
            var log = log_db.prepare(log_insert).run();
            success = 1;
        }
        catch(e){
            console.log(e);
            success = 0;
            msg = "에러내용 : " + e;
        }
        // res.json(result);
        res.json({result: result, success: success, msg: msg});
    });
    //스캔 설정끝

    //이상선 추가 stop부분

    app.post('/scan/config/stop' , function(req,res){
        var sqlite = require("better-sqlite3");
        var shell = require('shelljs');
        var db = new sqlite("/home/cnbis/data/config.dat")
        var log_db = new sqlite("/home/cnbis/data/log.dat");
        var id = req.body.id;
        var status = req.body.status;
        var udate = "strftime ('%Y-%m-%d %H:%M:%S', 'now', 'localtime')";// 년월일시분초

        var major = "실시간보기";
        var minor = "";
        var contents = ""; 

        var cmd = "/home/cnbis/bin/scan stop"; //STOP 명령어 맞는지?
        shell.exec(cmd, function(code, stdout, stderr){
          if(status == 1){
            minor = "스캔진행";
            contents = "진행 : " + id;
            console.log("status",진행);
            }else if(status == 4){                  //중지버튼 감사로그
                minor = "스캔중지";
                contents = "중지  : " +  id;
            }
            if(code == 0){
                var query = "update tb_control_config set status = '" + status + "', udate = " + udate + "where id = '" + id + "';";
                var result = db.prepare(query).run();

                var log_insert = "insert into audit_log (rdate, major, minor, contents) values (strftime ('%Y-%m-%d %H:%M:%S' , 'now', 'localtime'),'" + major + "','" + minor + "','" + contents + "')";
                var log = log_db.prepare(log_insert).run();
            }else{
                query = "update tb_control_config set status = '" + 3 + "', udate = " + udate + "where id = '" + id + "';";
                result = db.prepare(query).run();
            }

            res.json(result);
        });   
    });
}