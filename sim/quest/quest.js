var app = app || angular.module('app');

app.controller("QuestController", ['$scope','$http','$window', '$timeout', '$document', '$sce', function($scope, $http, $window, $timeout, $document, $sce){
    $scope.pycontrol = {};
    $scope.avrcontrol = {};
    $scope.show_tutorial = true;
    console.log($scope.quest_manifest);
    $scope.wf_timeout = 0;
    console.log("AAAAAA",$scope.a);
    $scope.quests = {}
    $scope.quest = null;
    $scope.problems = []
    $scope.userdata = {};
    $scope.userdata.programs = [];
    $scope.p = {"type":"python"};
    $scope.userdata.current_problem = 0;
    $scope.set_problem = function(x){
	console.log(x);
	if($scope.userdata.current_problem == x) return;
	var ptype = $scope.quest.problems[$scope.userdata.current_problem].type
	if(ptype == "python" || ptype == "advpython"){
	    console.log("PPP",$scope.pycontrol.get_program(),$scope.quest.programs[$scope.userdata.current_problem]);
	    $scope.quest.programs[$scope.userdata.current_problem] = $scope.pycontrol.get_program();
	    $scope.userdata.current_problem = x;
	    $scope.pycontrol.set_program($scope.quest.programs[$scope.userdata.current_problem]);
	}
	else if(ptype == "avr"){
	    console.log("AAA",$scope.avrcontrol.get_program(),$scope.quest.programs[$scope.userdata.current_problem]);
	    $scope.quest.programs[$scope.userdata.current_problem] = $scope.avrcontrol.get_program();
	    $scope.userdata.current_problem = x;
	    $scope.avrcontrol.set_program($scope.quest.programs[$scope.userdata.current_problem]);
	}
    }
    $scope.toggle_tutorial = function(){
	console.log("STSTS",$scope.show_tutorial);
	$scope.show_tutorial = !($scope.show_tutorial);
    }
    $scope.get_html = function(){
	//console.log($scope.problems[$scope.userdata.current_problem].text);
	return $sce.trustAsHtml($scope.quest.problems[$scope.userdata.current_problem].text);
    }

    $scope.wait_for = function(f){
	console.log("QN",$scope.quest_name);
	if($scope.quest_name != undefined){
	    f($scope.quest_name);
	    $scope.wf_timeout = 0;
	    $scope.$apply();
	}
	else{
	    $scope.wf_timeout = 2*$scope.wf_timeout+1;
	    $timeout($scope.wf_timeout,function(){$scope.wait_for(f)});
	}
    }
    
    $scope.getstuff = function(qns,id_to_set){
	var total = qns.length;
	for(var i = 0; i < qns.length; i++){
	    var qn = qns[i];
	    console.log("Getting",qn);
	    $http.get(qn).
		success(function(data, status, headers, config) {
		    console.log(data);
		    var qxml = (new window.DOMParser()).parseFromString(data, "text/xml");
		    var new_quest = {};
		    new_quest.name = qxml.documentElement.getAttribute("name");
		    new_quest.id = qxml.documentElement.getAttribute("id");
		    new_quest.problems = [];
		    new_quest.programs = [];
		    var l = qxml.getElementsByTagName("q");
		    for(var i = 0; i < l.length; i++){
			var p = {};
			p.type = l[i].getAttribute("type");
			p.id = l[i].getAttribute("id");
			console.log(l[i].getElementsByTagName("text")[0]);
			p.text = l[i].getElementsByTagName("text")[0].innerHTML;
			new_quest.problems.push(p);
			new_quest.programs.push(l[i].getElementsByTagName("program")[0].innerHTML.replace(/&gt;/g,">").replace(/&lt;/g,"<"));
		    }
		    $scope.userdata.current_problem = 0;
		    $scope.quests[new_quest.id] = new_quest;
		    if(id_to_set == new_quest.id){
			$scope.quest = new_quest;
			console.log("QID",$scope.quest.id);
			$scope.$emit('set_hwid',$scope.quest.id);
			console.log("sending it down");
			$scope.update_sim();
		    }
		    total--;
		    if(total == 0){
			$scope.$emit('loaded',$scope.quest.id);
		    }
		    console.log("QS",$scope.quests);
		}).
		error(function(data, status, headers, config) {
		    console.log(status);
		});
	}
    }
    $scope.update_sim = function(){
	console.log($scope.pycontrol);
	console.log($scope.quest);
	if($scope.pycontrol.set_program && $scope.quest && ($scope.quest.problems[$scope.userdata.current_problem].type == "python" || $scope.quest.problems[$scope.userdata.current_problem].type == "advpython"))
	    $scope.pycontrol.set_program($scope.quest.programs[$scope.userdata.current_problem]);
	if($scope.avrcontrol.set_program && $scope.quest && $scope.quest.problems[$scope.userdata.current_problem].type == "avr")
	    $scope.avrcontrol.set_program($scope.quest.programs[$scope.userdata.current_problem]);
    }
    $scope.update_model = function(){
	var ptype = $scope.quest.problems[$scope.userdata.current_problem].type
	if(ptype == "python" || ptype == "advpython"){
	    $scope.quest.programs[$scope.userdata.current_problem] = $scope.pycontrol.get_program();
	}
	else if(ptype == "avr"){
	    $scope.quest.programs[$scope.userdata.current_problem] = $scope.avrcontrol.get_program();
	}
    }
    $scope.$on('spy_linked',function(event, data){
	console.log("LALALALAA",data);
	$scope.update_sim();
    });
    $scope.$on('jsavr_linked',function(event, data){
	console.log("LALALALAAJ",data);
	$scope.update_sim();
    });
    console.log($scope.problems);
}])
    .directive('exploration',function(){
	return {
	    restrict: 'E',
	    scope:{
		control: '='
	    },
	    templateUrl: function(element,attrs){
		return attrs.template;
	    },
	    controller: 'QuestController',
	    link: function(scope,element,attrs){
		scope.quest_name = attrs.questName;
		console.log("LINKY",scope,element,attrs);
		if(scope.control){
		    scope.control.set_data = function(quest_urls,id_to_set){
			console.log("DD",quest_urls);
			scope.getstuff(quest_urls,id_to_set)
		    }
		    scope.control.set_quest = function(qid){
			scope.update_model();
			console.log("qid",qid,scope.quest_name);
			scope.quest = scope.quests[qid]
			scope.userdata.current_problem = 0;
			scope.hwid = qid;
			scope.update_sim();
		    }
		    scope.control.get_program_data = function(){
			scope.update_model();
			return {'problems':scope.quest.problems,'programs':scope.quest.programs}
		    }
		    scope.control.set_programs = function(info){
			scope.quests[info.id].programs = info.data;
			if(info.id == scope.quest.id){
			    scope.userdata.programs = info.data;
			}
			scope.update_sim();
		    }
		    console.log("going");
		    scope.$emit("qready");
		}
	    }
	}
    });

