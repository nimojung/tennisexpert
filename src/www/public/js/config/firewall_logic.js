	var selected_index = 0;
	var $src_ip = $('#src_ip');
	var $src_port = $('#src_port');
	var $dst_ip = $('#dst_ip');
	var $dst_port = $('#dst_port');
	var $table = $('#list');
	var $btnDeleteModal = $('#btnDeleteModal');
	var $btnApply_modal = $('#btnApply_modal'); //적용 버튼

	$(document).ready(function() {
	    //table이나 기타 설정 (기본) s
	});

	//수석님께서 알려주신것
	function totalFormatter(data) {
	    var total = 0;
	    if (data > 0) {
	        return data.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	    }
	    return data;
	};

	//포트번호 합치기
	function srcip_and_srcport_Formatter(value, row, index, field) {
	    return row.src_ip + ":" + row.src_port;
	};

	function dstip_and_dstport_Formatter(value, row, index, field) {
	    return row.dst_ip + ":" + row.dst_port;
	}

	function directionFormatter(data) {
	    if (data == 1) {
	        return '<span class="glyphicon glyphicon-arrow-right" style="color: #005ce6;"></span>'; //>
	    } else if (data == 2) {
	        return '<span class="glyphicon glyphicon-arrow-left" style="color: #e60000;"></span>'; //<
	    } else if (data == 3) {
	        return '<span class="glyphicon glyphicon-resize-horizontal" style="font-size:17px; color: #cc6600;"></span>';
	    } else {
	        return '';
	    }
	}

	function actionFormatter(data) {
	    if (data == 1) {
	        return '허가';
	    } else if (data == 2) {
	        return '차단';
	    } else {
	        return '';
	    }
	};

	function addDetail() {
	    var row = {};
	    row.sid = 0;
	    row.action = 1;
	    row.yn_used = 1;
	    row.direction = "1";
	    row.src_ip = "0.0.0.0";
	    row.src_port = "0";
	    row.dst_ip = "0.0.0.0";
	    row.dst_port = "0";
	    row.proto = "tcp";
	    row.service = "http";
	    row.position = 1;

	    setData(-1, row);
	}


	function DeleteDetail() {
	    $('#DeleteMyModal').modal('show');
	}

	function ApplyFirewall() {
	    $('#ApplyMyModal').modal('show');
	}


	function setData(idx, row) {
	    selected_index = idx;

	    //sid
	    $('#sid').val(row.sid);

	    //행위
	    if (row.action == "1") {
	        $('input:checkbox[id="action"]').prop("checked", true);
	    } else if (row.action == "2") {
	        $('input:checkbox[id="action"]').prop("checked", false);
	    }

	    //사용 여부 yn_used
	    if (row.yn_used == "1") {
	        $('input:checkbox[id="yn_used"]').prop("checked", true);
	    } else if (row.yn_used == "0") {
	        $('input:checkbox[id="yn_used"]').prop("checked", false);
	    }

	    //방향
	    $('#direction').val(row.direction);

	    //출발지 ip
	    $('#src_ip').val(row.src_ip);
	    //출발지 ip 포트
	    $('#src_port').val(row.src_port);

	    //목적지 ip
	    $('#dst_ip').val(row.dst_ip);
	    //목적지 port
	    $('#dst_port').val(row.dst_port);

	    //프로토콜 tcp, udp
	    $('#proto').val(row.proto);

	    //서비스
	    $('#service').val(row.service);

	    //rdate
	    $('#rdate').val(row.rdate);

	    //udate
	    $('#udate').val(row.udate);

	    //position
	    $('#position').val(row.position);

	    //모달창에 보내기~
	    $('#myModal').modal('show');

	    //모달창이 안닫히게 하고 싶으면 이거 주석 풀기
	    //$('#myModal').modal({backdrop: 'static'});
	    $('#src_check').text("");
	}

	// event 선언
	$(function() {
	    $src_ip = $('#src_ip');
	    $src_port = $('#src_port');
	    $dst_ip = $('#dst_ip');
	    $dst_port = $('#dst_port');
	    $table = $('#list');
	    $btnDeleteModal = $('#btnDeleteModal');
	    $btnApply_modal = $('#btnApply_modal'); //적용버튼

	    $table.bootstrapTable('hideColumn', 'rdate');
	    // $table.bootstrapTable('hideColumn', 'udate');


	    $("#btnAdd").click(function() {
	        addDetail();
	    });

	    //btnDeleteModal은 모달을 띄우기 위한 버튼
	    $btnDeleteModal.on('click', function() {
	        //버튼 클릭하면 딜렉트디테일로 이동
	        DeleteDetail();
	    });

	    //btnApply은 모달을 띄우기 위한 버튼
	    $btnApply_modal.on('click', function() {
	        //버튼 클릭하면 딜렉트디테일로 이동
	        ApplyFirewall();
	    });

	    $table.on('click-row.bs.table', function(e, row, $element) {
	        var idx = $element.attr('data-index');
	        setData(idx, row);
	    });

	    $('#btnSearch').on('click', function() {
	        //alert("조회 버튼 클릭."); search_select
	        $table.bootstrapTable('refresh', {
	            silent: true
	        });
	    });

	    //btnDelete버튼은 모달안에 삭제 버튼.
	    $('#btnDelete').on('click', function() {
	        try {
	            var sid = "";
	            ids = $.map($table.bootstrapTable('getSelections'), function(row) {

	                if (sid == "") {
	                    sid = row.sid;
	                } else {
	                    sid += "," + row.sid;
	                }
	            });

	            $.ajax({
	                url: '/config/firewall/delete', //가져오고자하는 서버페이지 주소를 넣는다. 
	                type: 'post', //데이터를 서버로 전송하게 된다. 
	                data: {
	                    sid: sid
	                },
	                success: function(t) {
	                    console.log('삭제 성공');
	                }
	            });

	            //$table.bootstrapTable('refresh', {url: '/config/firewall/select'});
	            $table.bootstrapTable('refresh', {
	                silent: true
	            });
	        } catch (e) {
	            console.log('에러' + e);
	        }
	    });

	    $('#btnSave').on('click', function() {
	        try {
	            // alert("데이터 전송~");
	            // 행위값 전송 
	            var action = 2;
	            if ($('input:checkbox[id="action"]').prop("checked")) {
	                action = 1;
	            }

	            //사용 여부 값 전송
	            var yn_used = 0;
	            if ($('input:checkbox[id="yn_used"]').prop("checked")) {
	                var yn_used = 1;
	            }


	            var sid = $('#sid').val();

	            $.ajax({
	                url: '/config/firewall/insert', //가져오고자하는 서버페이지 주소를 넣는다. 
	                type: 'post', //데이터를 서버로 전송하게 된다. 
	                data: {
	                    sid: $('#sid').val(),
	                    action: action,
	                    yn_used: yn_used,
	                    direction: $('#direction').val(),
	                    src_ip: $('#src_ip').val(),
	                    src_port: $('#src_port').val(),
	                    dst_ip: $('#dst_ip').val(),
	                    dst_port: $('#dst_port').val(),
	                    proto: $('#proto').val(),
	                    service: $('#service').val(),

	                    rdate: $('#rdate').val(),
	                    udate: $('#udate').val(),
	                    position: $('#position').val()
	                },
	                success: function(t) {
	                    if (t.success == 1) {
	                        try {
	                            // reload 또는 row 값 업데이트(갱신)
	                            //location.reload();
	                            //alert('성공');

	                            $table.bootstrapTable('updateRow', {
	                                index: selected_index,
	                                row: {
	                                    sid: $('#sid').val(),
	                                    action: action,
	                                    yn_used: yn_used,
	                                    direction: $('#direction').val(),
	                                    src_ip: $('#src_ip').val(),
	                                    src_port: $('#src_port').val(),
	                                    dst_ip: $('#dst_ip').val(),
	                                    dst_port: $('#dst_port').val(),
	                                    proto: $('#proto').val(),
	                                    service: $('#service').val(),

	                                    rdate: $('#rdate').val(),
	                                    udate: $('#udate').val(),
	                                    position: $('#position').val()
	                                }
	                            });
	                        } catch (e) {
	                            console.log('에러' + e);
	                        }
	                    } else {
	                        alert('입력한 정보를 다시한번 확인해 주세요.');
	                    }
	                }
	            });
	            $table.bootstrapTable('refresh', {
	                silent: true
	            });
	        } catch (e) {
	            console.log('에러' + e);
	        }
	    });

	    //테이블 행 클릭 이벤트 여기 수정 해야함
	    $table.on('check.bs.table check-all.bs.table', function() {
	        $btnDeleteModal.prop('disabled', !$table.bootstrapTable('getSelections').length);
	        $btnDeleteModal.css("background-color", "red");
	    });
	    //클릭을 여러개하고 하나라고 체크된것을 풀면 비활성화가 되는데 하나라도 체크가 되어 있다면 활성화 시키도록 함
	    $table.on('uncheck.bs.table uncheck-all.bs.table', function() {
	        if (!$table.bootstrapTable('getSelections').length == false) {
	            $btnDeleteModal.css("background-color", "red");
	        } else {
	            $btnDeleteModal.prop('true', !$table.bootstrapTable('getSelections').length);
	            $btnDeleteModal.css("background-color", "#F2A6A6");
	        }
	    });


	    //삭제버튼을 누르고 취소 버튼을 누르면 활성화 되어 있는 삭제 버튼을 비활성화 해줍니다.
	    $btnDeleteModal.click(function() {
	        $btnDeleteModal.prop('disabled', true);
	        $btnDeleteModal.css("background-color", "#F2A6A6");
	    });



	    $('#src_ip, #src_port, #dst_ip, #dst_port').on('keyup keydown', function() {
	        var $input = $(this);
	        checkValidate($input[0].id);
	    });

	    //btnCancel은 모달안에 삭제 버튼.
	    $('#btnCancel, #btnSave_cancel').on('click', function() {
	        $table.bootstrapTable('refresh', {
	            silent: true
	        });
	    });

	    //적용 버튼 이벤트
	    $('#btnApply').on('click', function() {
	        //여기서 이벤트 작성하기.
	        $.getJSON("/config/fw/apply", function(result) {

	            console.log(result);
	            // $.each(result, function(i, field){
	            //  $("div").append(field + " ");
	            // });
	            if (result.success == 1) { //1로 바까야 함 1이 성공 0이 실패
	                $('#Apply_true').val(result.rules_count);
	                $('#ApplyMyModal_true').modal('show');
	            } else {
	                $('#Apply_false').val(result.stderr);
	                $('#ApplyMyModal_false').modal('show');
	            }
	        });
	    });

	    //이건 삭제 버튼을 누르고 여백 누르면 모달창이 닫히는데 그때 체크 되어 있는 상태에서
	    //버튼이 활성화 되어 있어서 새로 고침 하게 만듦.
	    $('#DeleteMyModal').on('hidden.bs.modal', function() {
	        $table.bootstrapTable('refresh', {
	            silent: true
	        });
	    });

	});

	function checkValidate(id) {
	    //ip 유효성 검사
	    var new2_check = /(^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$)/;
	    //port 유효성 검사
	    var port_check = /^[0-9]*$/;

	    var new2_check2 = /(^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\,(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$)|(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/;

	    var src_ip = $src_ip.val();
	    var src_port = $src_port.val();
	    var dst_ip = $dst_ip.val();
	    var dst_port = $dst_port.val();
	    var disabled_id = [],
	        msg = [];

	    var arr_allow_ip = ["any", "$HOME_NET"];
	    var arr_allow_port = ["abc"];

	    var src_check_ip = [];
	    var last_index_src_ip = src_ip.length - 1;

	    var dst_check_ip = [];
	    var last_index_dst_ip = dst_ip.length - 1;
	    //출발지 ip유효성 검증 부분
	    if ((src_ip[0] == "[") && (src_ip[last_index_src_ip] == "]")) {
	        console.log('그룹 ip =>' + src_ip[0]);
	        src_check_ip = src_ip.substr(1, last_index_src_ip - 1).split(",");
	        console.log('src_check_ip=>' + src_check_ip);
	        // return true;
	    } else {
	        src_check_ip.push(src_ip);
	    }
	    //목적지 ip유효성 검증 부분
	    if ((dst_ip[0] == "[") && (dst_ip[last_index_dst_ip] == "]")) {
	        console.log('그룹 ip =>' + dst_ip[0]);
	        dst_check_ip = dst_ip.substr(1, last_index_dst_ip - 1).split(",");
	        console.log('dst_check_ip=>' + dst_check_ip);
	        // return true;
	    } else {
	        dst_check_ip.push(dst_ip);
	    }

	    src_check_ip.forEach(function(ip) {
	        console.log('ip는? => ' + ip);
	        console.log('new2_check.test(ip) =>' + new2_check.test(ip));

	        if (new2_check.test(ip) == false) {
	            var bExist = false;
	            arr_allow_ip.forEach(function(value) {
	                if (ip == value) {
	                    bExist = true;
	                }
	            });
	            if (bExist == false) {
	                disabled_id.push("src_ip");
	                msg.push("출발지 IP");
	            };
	        }
	    });


	    dst_check_ip.forEach(function(ip) {
	        console.log('ip는? => ' + ip);
	        console.log('new2_check.test(ip) =>' + new2_check.test(ip));

	        if (new2_check.test(ip) == false) {
	            var bExist = false;
	            arr_allow_ip.forEach(function(value) {
	                if (ip == value) {
	                    bExist = true;
	                }
	            });
	            if (bExist == false) {
	                disabled_id.push("dst_ip");
	                msg.push("목적지 IP");
	            };
	        }
	    });


	    // if(new2_check.test(src_ip) == false) {
	    //  disabled_id.push("src_ip");
	    //  msg.push("출발지 IP");
	    // }

	    if (port_check.test(src_port) == false) {
	        var bExist = false;
	        arr_allow_port.forEach(function(value) {
	            if (src_port == value) {
	                bExist = true;
	            }
	        });
	        if (bExist == false) {
	            disabled_id.push("src_port");
	            msg.push("출발지 Port");
	        };
	    }

	    if (port_check.test(dst_port) == false) {
	        var bExist = false;
	        arr_allow_port.forEach(function(value) {
	            if (dst_port == value) {
	                bExist = true;
	            }
	        });
	        if (bExist == false) {
	            disabled_id.push("dst_port");
	            msg.push("목적지 Port");
	        }
	    }

	    if (disabled_id.length > 0) {
	        var idx = 0;
	        for (var i = 0; i < disabled_id.length; i++) {
	            if (disabled_id[i] == id) {
	                idx = i;
	            }
	        }
	        $('#src_check').text(msg[idx] + "를 확인해 주세요.");
	        $('#btnSave').attr('disabled', true);

	    } else {
	        if (new2_check.test(src_ip) == true) {
	            if (src_ip[0] == "[") {
	                $('#src_check').text("출발지 IP를 확인해 주세요.");
	                $('#btnSave').attr('disabled', true);
	            } else {
	                $('#src_check').text("");
	                $('#btnSave').attr('disabled', false);
	            }
	        } else if (new2_check.test(dst_ip) == true) {
	            if (dst_ip[0] == "[") {
	                $('#src_check').text("목적지 IP를 확인해 주세요.");
	                $('#btnSave').attr('disabled', true);
	            } else {
	                $('#src_check').text("");
	                $('#btnSave').attr('disabled', false);
	            }
	        } else {
	            $('#src_check').text("");
	            $('#btnSave').attr('disabled', false);
	        }
	    }
	}

	//초기화면 셋팅 하기
	function queryParams(params) {
	    params.search = $("#search").val();
	    params.ip_val = $("#search_select").val();

	    return params;
	}

	function addImage(pk) {
	    alert("addImage: " + pk);
	}