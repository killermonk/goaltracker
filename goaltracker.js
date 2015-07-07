angular.module('GoalTracker', ['ui.bootstrap', 'ui.bootstrap.accordion', 'ngAnimate'])
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
				if (goals[name])
					return _deserializeGoal(goals[name]);
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
		},
		remove: function(name) {
			var goals = gtPersist.get('goals', {});
			delete goals[name];
			gtPersist.put('goals', goals);
		}
	};
})
.controller('GoalTrackerCtrl', GoalTrackerCtrl)
.controller('AddGoalCtrl', AddGoalCtrl)
.controller('EditGoalCtrl', EditGoalCtrl)
.controller('DeleteGoalCtrl', DeleteGoalCtrl)
.controller('AddProgressCtrl', AddProgressCtrl);


function GoalTrackerCtrl($scope, $modal, $timeout, gtPersist, gtGoals) {
	$scope.goals = {};
	$scope.alerts = [];
	$scope.goal_info = {};
	$scope.status = {};

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
	$scope.closeAlert = function(idx) {
		$scope.alerts.splice(idx, 1);
	};

	function _rebuildGoals() {
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
		});

		angular.forEach($scope.goal_info, function(value, name) {
			if (! active_goals[name]) {
				delete $scope.goal_info[name];
			}
		});
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

	$scope.showAddGoal = function() {
		var modalInstance = $modal.open({
			templateUrl: 'partial/goal_dialog.html',
			controller: 'AddGoalCtrl'
		});

		modalInstance.result.then(function(goal) {
			try {
				_addGoal(goal.name, goal.word_count, goal.days_remaining);
			} catch (error) {
				_error(error);
			}
		});
	};

	function _editGoal(name, newName, wordCount, daysRemaining) {
		_validateGoal(newName, wordCount, daysRemaining);

		var existing = $scope.goals[name];
		if (!existing)
			throw 'Goal "' + name + '" does not exist';

		var end_date = moment().startOf('day').add(daysRemaining, 'day');
		var goal = {
			total: wordCount,
			start: existing.start,
			end: end_date,
			log: existing.log
		};

		$scope.goals[newName] = goal;
		$scope.status[newName] = true;
		gtGoals.save(newName, goal);

		if (newName !== name) {
			delete $scope.goals[name];
			gtGoals.remove(name);
		}
	}

	$scope.showEditGoal = function($event, name) {
		$event.preventDefault();
		$event.stopPropagation();

		var goal = $scope.goals[name];
		if (!goal)
			throw 'Goal "' + name + '" does not exist';

		var scope = $scope.$new();
		scope.goal = {
			name: name,
			word_count: goal.total,
			days_remaining: Math.floor(moment.duration(goal.end - moment()).asDays())
		};

		var modalInstance = $modal.open({
			templateUrl: 'partial/goal_dialog.html',
			controller: 'EditGoalCtrl',
			scope: scope
		});

		modalInstance.result.then(function(goal) {
			try {
				_editGoal(name, goal.name, goal.word_count, goal.days_remaining);
			} catch (error) {
				_error(error);
			}
		});
	};

	$scope.showDeleteGoal = function($event, name) {
		$event.preventDefault();
		$event.stopPropagation();

		var goal = $scope.goals[name];
		if (!goal)
			throw 'Goal "' + name + '" does not exist';

		var scope = $scope.$new();
		scope.goal_name = name;

		var modalInstance = $modal.open({
			templateUrl: 'partial/delete_goal_confirm.html',
			controller: 'DeleteGoalCtrl',
			scope: scope
		});
		modalInstance.result.then(function() {
			delete $scope.goals[name];
			gtGoals.remove(name);
		});
	}

	function _validateProgress(date, count) {
		if (angular.isUndefined(date) || date.length == 0 || !moment(new Date(date)).isValid())
			throw 'Progress date is invalid';

		if (angular.isUndefined(count) || !Number.isFinite(count) || count <= 0)
			throw 'Progress count must be a number greater than 0';
	}

	function _addProgress(name, date, count) {
		_validateProgress(date, count);

		var goal = $scope.goals[name];
		if (!goal)
			throw 'Goal "' + name + '" does not exist';

		var dt = moment(new Date(date));

		goal.log.push({
			date: dt,
			progress: count
		});
		gtGoals.save(name, goal);
	}

	$scope.showAddProgress = function(name) {
		var goal = $scope.goals[name];
		if (!goal)
			throw 'Goal "' + name + '" does not exist';

		var scope = $scope.$new();
		scope.params = {
			name: name,
			format: 'MM/dd/yyyy',
			start_date: goal.start.format('MM/DD/YYYY'),
			today: moment().format('MM/DD/YYYY')
		};
		scope.dateOptions = {};
		scope.dt_open = false;
		scope.progress = {
			date: moment().format('MM/DD/YYYY')
		};

		scope.toggleDatePicker = function($event) {
			$event.preventDefault();
			$event.stopPropagation();

			scope.dt_open = !scope.dt_open;
		};

		var modalInstance = $modal.open({
			templateUrl: 'partial/progress_dialog.html',
			controller: 'AddProgressCtrl',
			scope: scope
		});

		modalInstance.result.then(function(progress) {
			try {
				_addProgress(name, progress.date, progress.count);
			} catch (error) {
				_error(error);
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

function EditGoalCtrl($scope, $modalInstance) {
	$scope.cancel = $modalInstance.dismiss;

	$scope.save = function(goal) {
		$modalInstance.close(goal);
	};
}

function DeleteGoalCtrl($scope, $modalInstance) {
	$scope.cancel = $modalInstance.dismiss;
	$scope.save = $modalInstance.close;
}

function AddProgressCtrl($scope, $modalInstance) {
	$scope.cancel = $modalInstance.dismiss;

	$scope.save = function(progress) {
		$modalInstance.close(progress);
	};
}
