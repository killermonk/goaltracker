angular.module('GoalTracker', ['ui.bootstrap'])
.factory('gtPersist', function(){
	var prefix = 'gt_';

	return {
		put: function(key, value) {
			localStorage.setItem(prefix+key, angular.toJson(value));
		},
		get: function(key, defaultValue) {
			var value = localStorage.getItem(prefix+key);
			return (angular.isDefined(value) && value !== null) ? value : defaultValue;
		}
	};
})
.controller('GoalTrackerCtrl', GoalTrackerCtrl)
.controller('AddGoalCtrl', AddGoalCtrl)
.controller('EditGoalCtrl', EditGoalCtrl)
.controller('DeleteGoalCtrl', DeleteGoalCtrl);


function GoalTrackerCtrl($scope, $modal, gtPersist) {
	$scope.goals = [];

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

		// TODO save
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
