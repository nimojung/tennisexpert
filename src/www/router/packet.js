module.exports = function(app, fs)
{
    app.get('/packet/control', function(req, res){
        // abs path : /home/pi/test/views/config/firewall.ejs
        res.render('packet/control', {menuid:2});
    });

    app.post('/packet/control/insert', function(req, res){
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
        var flag = "1";
        var rdate = "strftime ('%Y-%m-%d %H:%M:%S', 'now', 'localtime')";
        
        var success = 1;
        var msg = "";

        var major = "테스트하기";
        var minor = "패킷시작";
        var contents = '이름 : ' + test_info_name + ', IP : ' + test_info_ip + ', 상태값 : ' + status;
        
        try{
            // 진행중일 때는 시작하면 안됨.
            // DB 또는 실제 프로세스 확인
            // 실제 확인
            var cmd = "/home/cnbis/bin/packet status";
            shell.exec(cmd, {timeout:1000}, function(code, stdout, stderr){
                // Running
                if(stdout.indexOf("Not") > -1){
                    // 성공 시에만...
                    var query = "insert into tb_control_config (id,ip,name,rdate,udate,flag,status) values('"
                    + id + "','" + test_info_ip +"','" + test_info_name + "'," + rdate + "," + udate +",'" + flag + "','" + status + "')" ;
                    var query_start = db.prepare(query).run();


                    var log_insert = "insert into audit_log (rdate, major, minor, contents) values (strftime ('%Y-%m-%d %H:%M:%S' , 'now', 'localtime'),'" + major + "','" + minor + "','" + contents + "')";
                    var log = log_db.prepare(log_insert).run(); //시작 감사로그
                    var cmd = "/home/cnbis/bin/packet start " + id; //START 명령어 맞는지?
                    shell.exec(cmd, function(code, stdout, stderr){
                        
                    });
                }else{
                    success = 1;
                    status = "5";
                    msg = "현재 러닝....";
                    
                }                
                res.json({id: id, success: success, msg: msg, status: status});
            });            
        }catch(e){
            
            msg = e;
            success = 0;
            res.json({id: id, success: success, msg: msg, status: status});
        }
    });

    app.get('/packet/control/select', function(req, res) {
        var id = req.query.id;
        var sqlite = require("better-sqlite3");
        var db = new sqlite("/home/cnbis/data/config.dat");
        var result = {};
        
        try{
            var control_query = "select t1.category, count(1) as cnt, (select count(1) from tb_packet t2 where t2.category = t1.category and t2.yn_used = 1)as cnt2 from tb_packet t1 group by t1.category";
            var simulatorlist = db.prepare(control_query).all();
            res.json(simulatorlist);
        }catch (e){
           
            res.send(e);
        }
    });

    app.get('/packet/realtime', function(req, res){ // 실시간보기
        // abs path : /home/pi/test/views/config/firewall.ejs
        var id = req.query.id;
        if((id == undefined) || (id == "")){
            // initial
            var sqlite = require("better-sqlite3");
            var db = new sqlite("/home/cnbis/data/config.dat");
            id = "";
            try{
                var control_query = "select max(id) as id from tb_control_config where flag = 1";
                var result = db.prepare(control_query).all();
                id = result[0].id;
            }catch (e){
                
            }           
            if(id == null){
                id = "";
            }
        }
        res.render('packet/realtime', {menuid:2, id:id});         
    });
    app.get('/packet/control/slave', function(req, res) {

        var id = req.query.id;
        var sqlite = require("better-sqlite3");
        var db = new sqlite("/home/cnbis/data/config.dat");
        var result = {};
        try{
            // packet
            var control_query = "select t2.category, min(t1.rdate) as rdate, max(t1.udate) as udate"
            + ", sum(t1.try_count) as try_count, sum(t1.success_count) as success_count"
            + ", sum(t1.fail_count) as fail_count, min(t1.status) as status"
            + ", count(t2.category) as cnt"
            + ", (select count(1) from tb_control_slave t3 where t3.id = t1.id and t3.sub_id in (select t4.id from tb_packet t4 where t4.category = t2.category) and t3.status > 1) as cnt2"
            + "  from tb_control_slave t1, tb_packet t2"
            + " where t1.id = '" + id + "' and t1.sub_id = t2.id"
            + " group by t2.category";
            console.log(control_query);
            var simulatorlist = db.prepare(control_query).all();
            res.json(simulatorlist);
        }catch (e){
            
            res.send(e);
        }
    });


    app.get('/packet/config/controlconfig', function(req, res) {
		if(req.session.login != "1"){res.redirect('/login?refer_url=' + req.originalUrl); return;}

        var id = req.query.id;
        var sqlite = require("better-sqlite3");
        var db = new sqlite("/home/cnbis/data/config.dat");
        var query = "select * from tb_control_config where id =" +id;
        var result = db.prepare(query).all();

        res.json(result);
    });

    app.get('/packet/config/tailfile' , function(req,res) {
        var id = req.query.id;
        var shell = require('shelljs');
        var cmd = "tail -n128 /tmp/" + id + ".log";
        
        shell.exec(cmd, function(code, stdout, stderr){
            
            res.send(stdout);
        });
    });

    app.post('/packet/config/stop' , function(req,res){
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

        var cmd = "/home/cnbis/bin/packet stop"; //STOP 명령어 맞는지?
        shell.exec(cmd, function(code, stdout, stderr){
              if(status == 1){
                    minor = "패킷진행";
                    contents = "진행 : " + id;
                   
            }else if(status == 4){                  //중지버튼 감사로그
                    minor = "패킷중지";
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
    app.get('/packet/config/realtime', function(req, res) {

        
        var sqlite = require("better-sqlite3");
        var db = new sqlite("/home/cnbis/data/config.dat");

        var query =  "select id, ip, name, rdate, udate, flag, status from tb_control_config where flag = 1";
        var result = db.prepare(query).all();

        res.json(result);
    });

   //여기부터 이승호 작성
    //패킷 테스트 하기 시작
   //메인화면의 테스트 부분 값 표시 하기
    app.get('/packet/main/info', function(req, res) {
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
                query = "select id, ip, name, rdate, udate, flag, status from tb_control_config where flag = '1' order by rdate desc Limit 3";
                list = db.prepare(query).all();
            }
            res.json(list);
        }catch (e){
            
        }
    });
    //여기까지 시뮬레이터 메인화면 패킷 조회

    
    /* 메인화면 -> 버튼 클릭(메인 화면의 테이블)
       상세페이지에 표시할 값 가져오기.*/
    app.get('/packet/detail', function(req, res) {
		if(req.session.login != "1"){res.redirect('/login?refer_url=' + req.originalUrl); return;}
		
        var id = req.query.id;
        res.render('packet/detail', {
            menuid: 2, 
            title: '상세 결과 보기',
            titleDetail: '패킷 상세 결과 보기', 
            id:id
        });
    });
    //패킷 상세 결과보기 페이지에서 기본정보 값 가져오기
    app.get('/packet/detail/slave', function(req, res) {    
		if(req.session.login != "1"){res.redirect('/login?refer_url=' + req.originalUrl); return;}
		
        var sqlite = require("better-sqlite3");
        var db = new sqlite("/home/cnbis/data/config.dat");
        var test_data = {};
        var id = req.query.id;
        try{
            var query = "select id, ip, name, rdate, udate, flag, status from tb_control_config where id = " + id + " order by rdate desc";
            var list = db.prepare(query).all();
        }catch (e){
           
        }
        res.json(list);
    });
    //패킷 상세 결과보기 페이지에서 패킷명, 상태, 결과들 값 가져오기
    app.get('/packet/detail/slaveList', function(req, res) {

        var id = req.query.id;
        var sqlite = require("better-sqlite3");
        var db = new sqlite("/home/cnbis/data/config.dat");
        //packet
        var control_query = "select t2.category, min(t1.rdate) as rdate, max(t1.udate) as udate"
                + ", sum(t1.try_count) as try_count, sum(t1.success_count) as success_count"
                + ", sum(t1.fail_count) as fail_count, min(t1.status) as status"
                + "  from tb_control_slave t1, tb_packet t2"
                + " where t1.id = '" + id + "' and t1.sub_id = t2.id"
                + " group by t2.category";
                //
        var result = db.prepare(control_query).all();
        console.log(result);
        console.log(control_query);

        res.json(result);
    });

    //메인화면 -> 취약성 점검 메뉴 ->최종 결과 보기 눌렀을때 페이지
    app.get('/packet/result', function(req, res) {
		if(req.session.login != "1"){res.redirect('/login?refer_url=' + req.originalUrl); return;}
		
        // abs path : /home/pi/test/views/config/firewall.ejs
        var id = req.query.id;
        res.render('packet/result', {
            menuid: 2, 
            title: '최종 결과보기',
            titleDetail: '최종 결과 보기',
            id:id 
        });     
    });
    //결과보기 페이지에서 목록 표시
    app.get('/packet/result/select', function(req, res) {
		if(req.session.login != "1"){res.redirect('/login?refer_url=' + req.originalUrl); return;}
		
        var sqlite = require("better-sqlite3");
        var db = new sqlite("/home/cnbis/data/config.dat");
        var id = req.query.id;
       
      try{
            if(id > 0){
                var query = "select id, ip, name, rdate, udate, flag, status from tb_control_config where flag = 1 and id=" + id + " order by rdate desc"; 
                var list = db.prepare(query).all();
            }else if(id == ''){
                query = "select id, ip, name, rdate, udate, flag, status from tb_control_config where flag = 1 order by rdate desc"; 
                list = db.prepare(query).all();
            }
            
        }catch (e){
            console.log(e);
        }
        res.json(list);    
    });

  //패킷 설정 시작
    app.get('/config/packet', function(req, res) {
        // abs path : /home/pi/test/views/config/firewall.ejs
        res.render('config/packet', {
            menuid: 4
        });
    });

    // 패킷 설정 상태값 불러오기
    app.get('/config/packet/setting', function(req, res) {
        var sqlite = require("better-sqlite3");
        var db = new sqlite("/home/cnbis/data/config.dat");
        var search = req.query.search;
        var search_select = req.query.search_select;
        var category_select = req.query.category_select;
        var query = "";
        try{
            //검색어 없을때 전체 조회
            if(search_select == 'packetName' & search == ''){
                query = "select id, identy, filename,cachename, category, yn_used, rdate, udate from tb_packet";
            }else { //검색어 입력 했을때 조회 (패킷명)
                if(search_select == 'packetName'){
                    query = "select id, identy, filename,cachename, category, yn_used, rdate, udate from tb_packet where identy like '%" + search + "%'";
                }else { //카테고리 선택 했을때
                    // query = "select id, identy, filename,cachename, category, yn_used, rdate, udate from tb_packet where category like '" + category_select + "%'";
                    query = "select id, identy, filename,cachename, category, yn_used, rdate, udate from tb_packet where category = '" + category_select + "'";
                }
            }
            console.log(query);
            var result = db.prepare(query).all();
        } catch (e){
            console.log(e);
        }
        res.json(result);
    });

    //패킷 설정값 업데이트
    app.post('/config/packet/setting/status', function(req, res) {
        var sqlite = require("better-sqlite3");
        var db = new sqlite("/home/cnbis/data/config.dat");
        var log_db = new sqlite("/home/cnbis/data/log.dat");
        var index = req.body.index;
        var id = req.body.id;
        var identy = req.body.identy;
        
        var udate = "strftime ('%Y-%m-%d %H:%M:%S', 'now', 'localtime')";

        var major = "패킷 설정";
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
            contents = '패킷명 : ' + identy + ', 사용여부 : ' + log_msg + '설정';
            //상태값 업데이트
            var query = 'update tb_packet set yn_used = "'+ index + '", udate =' + udate + '  where  id = ' + id;
            var result = db.prepare(query).run();
            // console.log(query);
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
    //패킷 설정 끝
    


    //패킷 테스트
    app.post('/config/packet/test', function(req, res) {
		var filename = '/home/cnbis/data/packets/' +  req.body.filename;

		function sendpacket() {
			return new Promise(function(resolve, reject) {
		        var success = "", msg = "";
		        var data = {};
		        try{
		            var cmd = "sudo tcpreplay -l 1 -i eth1 " + filename;
		            var shell = require('shelljs');
		            shell.exec(cmd, {timeout:3000}, function(code, stdout, stderr){
			            data.success = 1;
			            data.msg = stdout;
						resolve(data);
		            });    
		        }catch(e){
		            console.log(e);
		            data.success = 0;
		            data.msg = e;
					resolve(data);
		        }    
			});
		}

		sendpacket()
		.then(values => {
			res.json(values);
		});
    });

    //
    // 테스트 끝
    // 여기까지가 이승호 추가 끝
}

