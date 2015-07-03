angular.module('GoalTracker', ['ui.bootstrap', 'ngAnimate'])
.factory('gtPersist', function(){
	var prefix = 'gt_';

	return {
		put: function(key, value) {
			localStorage.setItem(prefix+key, angular.toJson(value));
		},
		get: function(key, defaultValue) {
			var value = localStorage.getItem(prefix+key);
			return (angular.isDefined(value) && value !== null) ? angular.fromJson(value) : defaultValue;
		}
	};
})
.factory('gtGoals', function(gtPersist){

	function _deserializeGoal(goal) {
		var log = [];
		angular.forEach(goal.log, function(entry) {
			log.push({
				date: moment(entry.date, moment.ISO_8601),
				progress: entry.progress
			});
		});

		return {
			total: goal.total,
			start: moment(goal.start, moment.ISO_8601),
			end: moment(goal.end, moment.ISO_8601),
			log: log
		};
	};

	return {
		get: function(name) {
			var goals = gtPersist.get('goals', {});
			if (name) {
				if (goal[name])
					return _deserializeGoal(goal[name]);
				else
					return null;
			} else {
				var ret_goals = {};
				angular.forEach(goals, function(goal, name) {
					ret_goals[name] = _deserializeGoal(goal);
				});
				return ret_goals;
			}
		},
		save: function(name, goal) {
			var goals = gtPersist.get('goals', {});
			goals[name] = goal;
			gtPersist.put('goals', goals);
		}
	};
})
.controller('GoalTrackerCtrl', GoalTrackerCtrl)
.controller('AddGoalCtrl', AddGoalCtrl)
.controller('EditGoalCtrl', EditGoalCtrl)
.controller('DeleteGoalCtrl', DeleteGoalCtrl);


function GoalTrackerCtrl($scope, $modal, $timeout, gtPersist, gtGoals) {
	$scope.goals = {};
	$scope.alerts = [];
	$scope.goal_info = {};

	$scope.$watch('goals', _rebuildGoals, true);

	$timeout(function(){
		$scope.goals = gtGoals.get();
	});

	function _alert(type, msg, auto_close) {
		var alert = {type: type, msg: msg};
		$scope.alerts.push(alert);
		if (auto_close) {
			$timeout(function(){
				var idx = $scope.alerts.indexOf(alert);
				if (idx >= 0) {
					$scope.alerts.splice(idx, 1);
				}
			}, 1500);
		}
	}
	function _error(msg, auto_close) {
		_alert('danger', msg, auto_close);
	}
	function _warn(msg, auto_close) {
		_alert('warn', msg, auto_close);
	}
	function _success(msg, auto_close) {
		_alert('success', msg, auto_close);
	}

	function _rebuildGoals() {
		console.log("Rebuilding goals", $scope.goals);

		var active_goals = {};
		angular.forEach($scope.goals, function(goal, name) {
			active_goals[name] = true;

			goal.start.startOf('day');
			goal.end.endOf('day');

			var today = moment().startOf('day');
			var total_days = Math.floor(moment.duration(goal.end - goal.start).asDays());
			// 0 if today, otherwise >1
			var elapsed_days = Math.max(0, Math.floor(moment.duration(today - goal.start).asDays()));
			var days_left = total_days - elapsed_days;

			var finished = false;
			// 1 (100%) if we are on or passed total_days
			var end_of_day_pace = Math.min(1, (elapsed_days + 1) / total_days);
			var end_of_day_count = Math.floor(goal.total * end_of_day_pace);
			if (elapsed_days > total_days) {
				finished = true;
			}

			var past_progress = 0; // Progress before today
			var today_progress = 0; // Progress for today
			var daily_progress = {};
			angular.forEach(goal.log, function(entry) {
				if (entry.date < today)
					past_progress += entry.progress;
				else
					today_progress += entry.progress;

				var date_str = entry.date.format("MM/DD/YYYY");

				if (!daily_progress[date_str])
					daily_progress[date_str] = 0;
				daily_progress[date_str] += entry.progress;
			});
			var goal_progress = past_progress + today_progress; // Progress towards the whole goal

			var words_per_day = Math.ceil((goal.total - past_progress) / days_left);
			var words_left_today = Math.max(0, words_per_day - today_progress);

			var goal_percent = (goal_progress / goal.total * 100).toPrecision(2);
			var pace_percent = (end_of_day_pace * 100).toPrecision(2);

			var behind_pace_by = (pace_percent - goal_percent).toPrecision(2);
			var ahead_of_pace_by = (goal_percent - pace_percent).toPrecision(2);

			$scope.goal_info[name] = {
				total: goal.total,
				end_of_day_count: end_of_day_count,
				goal_progress: goal_progress,
				words_per_day: words_per_day,
				today_progress: today_progress,
				end_date: goal.end.format("MM/DD/YYYY"),
				progress_log: daily_progress
			};
			/* @@ */
			console.log('Goal Info', name, $scope.goal_info);
			/* ## */
		});

		// Remove goals that aren't active
	};

	function _validateGoal(name, wordCount, daysRemaining) {
		if (angular.isUndefined(name) || name.length == 0)
			throw 'Goal name cannot be empty';

		if (angular.isUndefined(wordCount) || !Number.isFinite(wordCount) || wordCount <= 0)
			throw 'Word Count must be a number greater than 0';

		if (angular.isUndefined(daysRemaining) || !Number.isFinite(daysRemaining) || daysRemaining <= 0)
			throw 'Days Remaining must be a number greater than 0';
	}

	function _addGoal(name, wordCount, daysRemaining) {
		_validateGoal(name, wordCount, daysRemaining);

		var existing = $scope.goals[name];
		if (existing)
			throw 'Goal "' + name + '" already exists';

		var start_date = moment().startOf('day');
		var end_date = start_date.clone().add(daysRemaining, 'day');

		var goal = {
			total: wordCount,
			start: start_date,
			end: end_date,
			log: []
		};
		$scope.goals[name] = goal;
		gtGoals.save(name, goal);
	}

	$scope.showAddModal = function() {
		var modalInstance = $modal.open({
			templateUrl: 'partial/goal_dialog.html',
			controller: 'AddGoalCtrl'
		});

		modalInstance.result.then(function(goal) {
			try {
				_addGoal(name, wordCount, daysRemaining);
			} catch (error) {
				// TODO handle error
			}
		});
	};
}

function AddGoalCtrl($scope, $modalInstance) {
	$scope.cancel = $modalInstance.dismiss;

	$scope.save = function(goal) {
		$modalInstance.close(goal);
	};
}

function EditGoalCtrl($scope) {

}

function DeleteGoalCtrl($scope) {

}
