	var selected_index = 0;
	var $ip = $('#ip');
	var $cnt = $('#cnt');
	var $btnDeleteModal = $('#btnDeleteModal');
	var $btnApply_modal = $('#btnApply_modal'); //적용 버튼

	$(document).ready(function() {
		//table이나 기타 설정 (기본)
	});

	function yn_usedFormatter(data) {
		if (data == 1) {
			return 'on';
		} else if (data == 0) {
			return 'off';
		} else {
			return '';
		}
	};


	function addDetail() {
		var row = {};
		row.ip = "0";
		row.yn_used = 1;
		$('#ip').attr('disabled', false);
		$('#btnSave').attr('disabled', true);
		setData(-1, row);
	}


	function DeleteDetail() {
		$('#DeleteMyModal').modal('show');
	}

	function ApplyFirewall() {
		$('#ApplyMyModal').modal('show');
	}


	function setData(idx, row){
		selected_index = idx;

		//ip
		$('#ip').val(row.ip);

		//사용 여부 yn_used
		if (row.yn_used == "1") {
			$('input:checkbox[id="yn_used"]').prop("checked", true);
		} else if (row.yn_used == "0") {
			$('input:checkbox[id="yn_used"]').prop("checked", false);
		}

		//rdate
		$('#rdate').val(row.rdate);

		//udate
		$('#udate').val(row.udate);

		//sdate
		$('#sdate').val(row.edate);

		//edate
		$('#edate').val(row.sdate);

		//cnt
		$('#cnt').val(row.cnt);

		//모달창에 보내기~
		$('#myModal').modal('show');

		//모달창이 안닫히게 하고 싶으면 이거 주석 풀기
		//$('#myModal').modal({backdrop: 'static'});
		$('#src_check').text("");
	}

	// event 선언
	$(function() {
		$ip = $('#ip');
		$cnt = $('#cnt');
		$table = $('#list');
		$btnDeleteModal = $('#btnDeleteModal');
		$btnApply_modal = $('#btnApply_modal'); //적용버튼

		// $table.bootstrapTable('hideColumn', 'rdate');
		// $table.bootstrapTable('hideColumn', 'udate');

		console.log($ip);


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
			$table.bootstrapTable('refresh', {silent: true});
		});

		//btnDelete버튼은 모달안에 삭제 버튼.
		$('#btnDelete').on('click', function() {
			try {
				var cnt = "";
				var ip_test = "";
				ids = $.map($table.bootstrapTable('getSelections'), function(row) {
					
					

					if (cnt == "") {
						cnt = row.cnt;
						ip_test = row.ip;
					} else {
						cnt += "," + row.cnt;
						ip_test += ", " + row.ip;
					}
				});
				

				$.ajax({
					url: '/config/abnormal/delete', //가져오고자하는 서버페이지 주소를 넣는다. 
					type: 'post', //데이터를 서버로 전송하게 된다. 
					data: {
						cnt: cnt,
						ip: ip_test
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
				//사용 여부 값 전송
				var yn_used = 0;
				if ($('input:checkbox[id="yn_used"]').prop("checked")) {
					var yn_used = 1;
				}

				var ip = $('#ip').val();

				$.ajax({
					url: '/config/abnormal/insert', //가져오고자하는 서버페이지 주소를 넣는다. 
					type: 'post', //데이터를 서버로 전송하게 된다. 
					data: {
						ip: $('#ip').val(),
						yn_used: yn_used,
						rdate: $('#rdate').val(),
						udate: $('#udate').val(),
						udate: $('#sdate').val(),
						udate: $('#edate').val(),
						cnt: $('#cnt').val()
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
										ip: $('#ip').val(),
										yn_used: yn_used,
										rdate: $('#rdate').val(),
										udate: $('#udate').val(),
										udate: $('#sdate').val(),
										udate: $('#edate').val(),
										cnt: $('#cnt').val()
									}
								});
							} catch (e) {
								console.log('에러' + e);
							}
						} else{
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

		//체크박스 클릭
		$table.on('check.bs.table check-all.bs.table', function() {
			$btnDeleteModal.prop('disabled', !$table.bootstrapTable('getSelections').length);
			$btnDeleteModal.css("background-color","red");
		});
		//클릭을 여러개하고 하나라고 체크된것을 풀면 비활성화가 되는데 하나라도 체크가 되어 있다면 활성화 시키도록 함
		$table.on('uncheck.bs.table uncheck-all.bs.table', function() {
			if(!$table.bootstrapTable('getSelections').length == false){
				$btnDeleteModal.css("background-color","red");
			}else{
				$btnDeleteModal.prop('true', !$table.bootstrapTable('getSelections').length);   
				$btnDeleteModal.css("background-color","#F2A6A6");
			}
		});
		
		//삭제버튼을 누르고 취소 버튼을 누르면 활성화 되어 있는 삭제 버튼을 비활성화 해줍니다.
		$btnDeleteModal.click(function() {
			$btnDeleteModal.prop('disabled', true);
			$btnDeleteModal.css("background-color","#F2A6A6");
		});

		
		$('#ip').on('keyup keydown', function() {
			var $input = $(this);
			checkValidate($input[0].id); 
		});

		//btnCancel은 모달안에 삭제 버튼.
		$('#btnCancel, #btnSave_cancel').on('click', function() {
			$table.bootstrapTable('refresh', {
				silent: true
			});         
			$('#ip').attr('disabled', true);
		});

		//적용 버튼 이벤트
		$('#btnApply').on('click', function() {
			//여기서 이벤트 작성하기.
			$.getJSON("/config/abnormal/apply", function(result){

				console.log(result);
				// $.each(result, function(i, field){
				// 	$("div").append(field + " ");
				// });
				if(result.success == 1){ //1로 바까야 함 1이 성공 0이 실패
					$('#Apply_true').val(result.rules_count);
					$('#ApplyMyModal_true').modal('show');
				}else{
					$('#Apply_false').val(result.stderr);
					$('#ApplyMyModal_false').modal('show');
				}
			});
		});
		
		//이건 삭제 버튼을 누르고 여백 누르면 모달창이 닫히는데 그때 체크 되어 있는 상태에서
		//버튼이 활성화 되어 있어서 새로 고침 하게 만듦.
		$('#DeleteMyModal, #myModal').on('hidden.bs.modal', function () {
			$table.bootstrapTable('refresh', {
				silent: true
			});  
			$('#ip').attr('disabled', true);
			$('#btnSave').attr('disabled', false);
		});

	});

	function checkValidate(id){
		//ip 유효성 검사
		var ip_check = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/;
		//port 유효성 검사
		var port_check = /^[0-9]*$/;

		var ip = $ip.val();
		var disabled_id = [], msg = [];

		if(ip_check.test(ip) == false) {
			disabled_id.push("ip");
			msg.push("IP");
		}

		if(disabled_id.length > 0){
			var idx = 0;
			for(var i=0; i<disabled_id.length; i++){
				if(disabled_id[i] == id){
					idx = i;
				}
			}
			$('#src_check').text(msg[idx] + "를 확인해 주세요.");
			$('#btnSave').attr('disabled', true);
		}else{          
			$('#src_check').text("");
			$('#btnSave').attr('disabled', false);
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