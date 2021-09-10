//시뮬레이터 컨피그
module.exports = function(app, fs) {
    app.get('/config/ips/apply', function(req, res) {
		if(req.session.login != "1"){res.redirect('/login?refer_url=' + req.originalUrl); return;}
		
        // IPS룰 적용하기
        function loadrule() {
            return new Promise(function(resolve, reject) {
                var data = [];
                //  패턴(룰) 정보 조회 부분
                var sqlite = require('sqlite3');
                var db = new sqlite.Database('/home/cnbis/data/rule.dat');
                var query = "select sid,action,proto,direction,src_ip,src_port,dst_ip,dst_port,options from ips_rule where yn_used = 1";
                db.serialize(function() {
                    db.all(query, function(err, rows) {
                        if (err) {
                            reject('err');
                        }
                        if (rows.length > 0) {
                            var cnt = 0;
                            rows.forEach((row) => {
                                data.push(row);
                                cnt++;
                                if (cnt == rows.length) {
                                    resolve(data);
                                }
                            });
                        } else {
                            resolve(data);
                        }
                    });
                });
                db.close();
            });
        }

        function saverule(rules) {
            return new Promise(function(resolve, reject) {
                var values = {};
                // 넘겨받은 배열을 파일로 저장하기
                // 룰 경로에 특정 파일로 저장하니까, suricata.yaml의 rules 경로(default-rule-path:)를 변경해줘야 함.
                // rule-files: 부분도 cnbis_*.rules를 제외하고 모두 주석처리로 해야 함.
                // cnbis_clearning.rules (우선 순위 1)
                // cnbis_abnormal.rules (우선 순위 2)
                // cnbis_fw.rules (우선 순위 3)
                // cnbis_ips.rules (우선 순위 4)
                const FILE_PATH = "/home/cnbis/data/cnbis_ips.rules";
                var fs = require('fs');
                if (rules.length > 0) {
                    var data = "";
                    rules.forEach((row) => {
                        /*
                        alert http $HOME_NET any -> $EXTERNAL_NET any 
                        (msg:"ET TROJAN Win32/LockScreen CnC HTTP Pattern"; flow:established,to_server; content:"GET"; http_method; content:",0x"; 
                        http_uri; fast_pattern:only; pcre:"/(?:,0x[0-9a-f]{2}){10}$/U"; pcre:"/^Host\x3a[^\r\n]+\r\n(?:\r\n)?$/H"; 
                        reference:md5,8df8d0cd70f96538211c65fb6361704d; classtype:trojan-activity; sid:2022494; rev:2; metadata:created_at 2016_02_08, updated_at 2016_02_08;)
                        */
                        //  sid,action,proto,direction,src_ip,src_port,dst_ip,dst_port,options
                        var action = "alert";
                        if (row.action == 2) {
                            action = "drop";
                        }
                        data += action + " " + row.proto + " " + row.src_ip + " " + row.src_port + " " + row.direction + " " + row.dst_ip + " " + row.dst_port + " " + row.options + "\n";
                    });
                    values["rules_count"] = rules.length;
                    // 파일 저장 시, 동기화로 해줘야 함(비동기로 하면  ips reloading 시 패턴을 찾을 수(패턴 0개)가 없음
                    fs.writeFileSync(FILE_PATH, data);
                    resolve(values);
                } else {
                    fs.writeFileSync(FILE_PATH, "#");
                    values["rules_count"] = rules.length;
                    resolve(values);
                }
                fs.close;
            });
        }

        function applyrule(values) {
            return new Promise(function(resolve, reject) {
                // IPS 룰 재적용(reload)
                var shell = require('shelljs');
                var cmd = '/home/cnbis/bin/cnbis_ips reload';
                shell.exec(cmd, function(code, stdout, stderr) {
                    values["stdout"] = stdout;
                    values["stderr"] = stderr;
                    values["code"] = code;
                    values["success"] = 0;
                    if (code == 0) {
                        values["success"] = 1;
                    }
                    resolve(values);
                });
            });
        }

        function remainaudit(values) {
            return new Promise(function(resolve, reject) {
                // 감사로그 남기기
                var sqlite = require('sqlite3');
                var db = new sqlite.Database('/home/cnbis/data/log.dat');
                var query = "insert into audit_log(rdate, major, minor, contents) values(strftime ('%Y-%m-%d %H:%M:%S' , 'now', 'localtime'), '침입탐지', '패턴 적용', '적용된 패턴 갯수 : " + values["rules_count"] + "')";
                db.serialize(function() {
                    db.run(query);
                    values["audit"] = "1";
                    resolve(values);
                });
                db.close();
            });
        }

        loadrule()
            .then(saverule)
            .then(applyrule)
            .then(remainaudit)
            .then(values => {
                res.json(values);
            });
    });
    //이상선 추가
    app.get('/log/control', function(req, res) {
		if(req.session.login != "1"){res.redirect('/login?refer_url=' + req.originalUrl); return;}
		
        // abs path : /home/pi/test/views/config/firewall.ejs s
        res.render('log/control', {
            menuid: 2
        });
    });
    //
    
    app.get('/config/ips/mode', function(req, res) {
		if(req.session.login != "1"){res.redirect('/login?refer_url=' + req.originalUrl); return;}
		
        var flag = req.query.flag;

        if ((flag == "inline") || (flag == "span")) {
            // 정상 로직
        } else {
            res.send("no flag");
        }

        // IPS Inline(탐지,차단)하기
        function applymode() {
            return new Promise(function(resolve, reject) {
                var values = {};
                // 방화벽 설정 적용
                var shell = require('shelljs');
                var cmd = '/home/cnbis/bin/cnbis_inline';
                if (flag == "span") {
                    cmd = '/home/cnbis/bin/cnbis_span';
                }
                shell.exec(cmd, function(code, stdout, stderr) {
                    values["stdout"] = stdout;
                    values["stderr"] = stderr;
                    values["code"] = code;
                    values["success"] = 0;
                    if (code == 0) {
                        values["success"] = 1;
                    }
                    resolve(values);
                });
            });
        }

        function remainaudit(values) {
            return new Promise(function(resolve, reject) {
                // 감사로그 남기기
                var sqlite = require('sqlite3');
                var db = new sqlite.Database('/home/cnbis/data/log.dat');
                var query = "insert into audit_log(rdate, major, minor, contents) values(strftime ('%Y-%m-%d %H:%M:%S' , 'now', 'localtime'), '보안설정', 'INLINE', '인라인 적용')";
                if (flag == "span") {
                    "insert into audit_log(rdate, major, minor, contents) values(strftime ('%Y-%m-%d %H:%M:%S' , 'now', 'localtime'), '보안설정', 'SPAN', '바이패스(SPAN) 적용')";
                }
                db.serialize(function() {
                    db.run(query);
                    values["audit"] = "1";
                    resolve(values);
                });
                db.close();
            });
        }

        applymode()
            .then(remainaudit)
            .then(values => {
                res.json(values);
            });
    });

    app.get('/config/ips/status', function(req, res) {
		if(req.session.login != "1"){res.redirect('/login?refer_url=' + req.originalUrl); return;}
		
        // IPS 상태 조회하기
        function checkrunning() {
            return new Promise(function(resolve, reject) {
                var values = {};
                // 보안 상태값 조회                
                var shell = require('shelljs');
                var cmd = '/home/cnbis/bin/cnbis_ips status';
                shell.exec(cmd, function(code, stdout, stderr) {
                    var list = stdout.split("\n");
                    var running = false;
                    list.forEach(function(temp) {
                        if (temp.indexOf("running") > 0) {
                            running = true;
                        }
                    });
                    if (running) {
                        values["level"] = 1;
                        values["ips_status"] = 1;
                    } else {
                        values["level"] = 2
                        values["ips_status"] = 0;;
                    }
                    resolve(values);
                });
            });
        }

        checkrunning()
            .then(values => {
                res.json(values);
            });
    });


    app.get('/config/fw/apply', function(req, res) {
		if(req.session.login != "1"){res.redirect('/login?refer_url=' + req.originalUrl); return;}
		
        // 방화벽룰 적용하기
        function loadrule() {
            return new Promise(function(resolve, reject) {
                var data = [];
                //  패턴(룰) 정보 조회 부분
                var sqlite = require('sqlite3');
                var db = new sqlite.Database('/home/cnbis/data/rule.dat');
                var query = "select sid,action,proto,direction,src_ip,src_port,dst_ip,dst_port from fw_rule where yn_used = 1";
                db.serialize(function() {
                    db.all(query, function(err, rows) {
                        if (err) {
                            reject('err');
                        }
                        if (rows.length > 0) {
                            var cnt = 0;
                            rows.forEach((row) => {
                                data.push(row);
                                cnt++;
                                if (cnt == rows.length) {
                                    resolve(data);
                                }
                            });
                        } else {
                            resolve(data);
                        }
                    });
                });
                db.close();
            });
        }

        function saverule(rules) {
            return new Promise(function(resolve, reject) {
                var values = {};
                // 넘겨받은 배열을 파일로 저장하기
                // 룰 경로에 특정 파일로 저장하니까, suricata.yaml의 rules 경로(default-rule-path:)를 변경해줘야 함.
                // rule-files: 부분도 cnbis_*.rules를 제외하고 모두 주석처리로 해야 함.
                // cnbis_clearning.rules (우선 순위 1)
                // cnbis_abnormal.rules (우선 순위 2)
                // cnbis_fw.rules (우선 순위 3)
                // cnbis_ips.rules (우선 순위 4)
                // priority : 1(clearning), 2(abnormal), 3(firewall), 4(ips)
                const FILE_PATH = "/home/cnbis/data/cnbis_fw.rules";
                var fs = require('fs');
                if (rules.length > 0) {
                    var data = "";
                    rules.forEach((row) => {
                        /*
                        alert http $HOME_NET any -> $EXTERNAL_NET any 
                        (msg:"ET TROJAN Win32/LockScreen CnC HTTP Pattern"; flow:established,to_server; content:"GET"; http_method; content:",0x"; 
                        http_uri; fast_pattern:only; pcre:"/(?:,0x[0-9a-f]{2}){10}$/U"; pcre:"/^Host\x3a[^\r\n]+\r\n(?:\r\n)?$/H"; 
                        reference:md5,8df8d0cd70f96538211c65fb6361704d; classtype:trojan-activity; sid:2022494; rev:2; metadata:created_at 2016_02_08, updated_at 2016_02_08;)
                        */
                        //  sid,action,proto,direction,src_ip,src_port,dst_ip,dst_port 
                        // priority : 1(clearning), 2(abnormal), 3(firewall), 4+(ips)
                        var options = "(msg:\"CNBISFIREWALL[" + row.sid + "]\"; sid:" + row.sid + "; rev:1; classtype:firewall;)";
                        // IN, OUT으로 단방향이므로  OUT일 경우에는 src와 dst를 바꾸면 됨.
                        var direction = "->";
                        var action = "alert";
                        if (row.action == 2) {
                            action = "drop";
                        }
                        if (row.direction == "IN") {
                            // 정방향(Inbound)
                            data += action + " " + row.proto + " " + row.src_ip + " " + row.src_port + " " + direction + " " + row.dst_ip + " " + row.dst_port + " " + options;
                        } else {
                            // 역방향(Outbound)
                            data += action + " " + row.proto + " " + row.dst_ip + " " + row.dst_port + " " + direction + " " + row.src_ip + " " + row.src_port + " " + options;
                        }
                    });
                    values["rules_count"] = rules.length;
                    // 파일 저장 시, 동기화로 해줘야 함(비동기로 하면  ips reloading 시 패턴을 찾을 수(패턴 0개)가 없음
                    fs.writeFileSync(FILE_PATH, data);
                    resolve(values);
                } else {
                    fs.writeFileSync(FILE_PATH, "#");
                    values["rules_count"] = rules.length;
                    resolve(values);
                }
                fs.close;
            });
        }

        function applyrule(values) {
            return new Promise(function(resolve, reject) {
                // IPS 룰 재적용(reload)
                var shell = require('shelljs');
                var cmd = '/home/cnbis/bin/cnbis_ips reload';
                shell.exec(cmd, function(code, stdout, stderr) {
                    values["stdout"] = stdout;
                    values["stderr"] = stderr;
                    values["code"] = code;
                    values["success"] = 0;
                    if (code == 0) {
                        values["success"] = 1;
                    }
                    resolve(values);
                });
            });
        }

        function remainaudit(values) {
            return new Promise(function(resolve, reject) {
                // 감사로그 남기기
                var sqlite = require('sqlite3');
                var db = new sqlite.Database('/home/cnbis/data/log.dat');
                var query = "insert into audit_log(rdate, major, minor, contents) values(strftime ('%Y-%m-%d %H:%M:%S' , 'now', 'localtime'), '방화벽', '패턴 적용', '적용된 패턴 갯수 : " + values["rules_count"] + "')";
                db.serialize(function() {
                    db.run(query);
                    values["audit"] = "1";
                    resolve(values);
                });
                db.close();
            });
        }

        loadrule()
            .then(saverule)
            .then(applyrule)
            .then(remainaudit)
            .then(values => {
                res.json(values);
            });
    });

    app.get('/config/abnormal/apply', function(req, res) {
		if(req.session.login != "1"){res.redirect('/login?refer_url=' + req.originalUrl); return;}
		
        // 이상징후룰 적용하기
        function loadrule() {
            return new Promise(function(resolve, reject) {
                var data = [];
                //  패턴(룰) 정보 조회 부분
                var sqlite = require('sqlite3');
                var db = new sqlite.Database('/home/cnbis/data/rule.dat');
                // 허용된 아이피(내부망)를 제외한 나머지(잘못 들어간 값도 일단 제외)
                var query = "select ip from abnormal_rule where  yn_used = 1 and length(ip) > 6";
                db.serialize(function() {
                    db.all(query, function(err, rows) {
                        if (err) {
                            reject('err');
                        }
                        if (rows.length > 0) {
                            var cnt = 0;
                            rows.forEach((row) => {
                                data.push(row);
                                cnt++;
                                if (cnt == rows.length) {
                                    resolve(data);
                                }
                            });
                        } else {
                            resolve(data);
                        }
                    });
                });
                db.close();
            });
        }

        function saverule(rules) {
            return new Promise(function(resolve, reject) {
                var values = {};
                // 넘겨받은 배열을 파일로 저장하기
                // 룰 경로에 특정 파일로 저장하니까, suricata.yaml의 rules 경로(default-rule-path:)를 변경해줘야 함.
                // rule-files: 부분도 cnbis_*.rules를 제외하고 모두 주석처리로 해야 함.
                // cnbis_clearning.rules (우선 순위 1)
                // cnbis_abnormal.rules (우선 순위 2)
                // cnbis_fw.rules (우선 순위 3)
                // cnbis_ips.rules (우선 순위 4)
                // priority : 1(clearning), 2(abnormal), 3(firewall), 4(ips)
                const FILE_PATH = "/home/cnbis/data/cnbis_abnormal.rules";
                var fs = require('fs');
                if (rules.length > 0) {
                    var data = "";
                    var abnormal_ip = "";
                    rules.forEach((row) => {
                        if (abnormal_ip == "") {
                            abnormal_ip = row.ip;
                        } else {
                            abnormal_ip += "," + row.ip;
                        }
                    });
                    // priority : 1(clearning), 2(abnormal), 3(firewall), 4+(ips)
                    // 이상징후는 프로토콜이 없는(ip) 무조건 단방향이므로
                    data = "drop ip $TRUST_NET any  ->  ![" + abnormal_ip + "] any (msg:\"CNBIS_ABNORMAL_TRUST\"; sid:10000; rev:1; classtype:abnormal;)\n";
                    data += "drop ip $UNTRUST_NET any ->  ![" + abnormal_ip + "] any (msg:\"CNBIS_ABNORMAL_UNTRUST\"; sid:10001; rev:1; classtype:abnormal;)\n";

                    values["rules_count"] = rules.length;
                    // 파일 저장 시, 동기화로 해줘야 함(비동기로 하면  ips reloading 시 패턴을 찾을 수(패턴 0개)가 없음
                    fs.writeFileSync(FILE_PATH, data);
                    resolve(values);
                } else {
                    fs.writeFileSync(FILE_PATH, "#");
                    values["rules_count"] = rules.length;
                    resolve(values);
                }
                fs.close;
            });
        }

        function applyrule(values) {
            return new Promise(function(resolve, reject) {
                // IPS 룰 재적용(reload)
                var shell = require('shelljs');
                var cmd = '/home/cnbis/bin/cnbis_ips reload';
                shell.exec(cmd, function(code, stdout, stderr) {
                    values["stdout"] = stdout;
                    values["stderr"] = stderr;
                    values["code"] = code;
                    values["success"] = 0;
                    if (code == 0) {
                        values["success"] = 1;
                    }
                    resolve(values);
                });
            });
        }

        function remainaudit(values) {
            return new Promise(function(resolve, reject) {
                // 감사로그 남기기
                var sqlite = require('sqlite3');
                var db = new sqlite.Database('/home/cnbis/data/log.dat');
                var query = "insert into audit_log(rdate, major, minor, contents) values(strftime ('%Y-%m-%d %H:%M:%S' , 'now', 'localtime'), '이상징후', '패턴 적용', '적용된 패턴 갯수 : " + values["rules_count"] + "')";
                db.serialize(function() {
                    db.run(query);
                    values["audit"] = "1";
                    resolve(values);
                });
                db.close();
            });
        }

        loadrule()
            .then(saverule)
            .then(applyrule)
            .then(remainaudit)
            .then(values => {
                res.json(values);
            });
    });
}