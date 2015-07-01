angular.module('GoalTracker',['ui.bootstrap'])
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
	var modalInstance = $scope.showAddModal = function() {
		$modal.open({
			templateUrl: 'partial/goal_dialog.html',
			controller: 'AddGoalCtrl'
		});
	};
}

function AddGoalCtrl($scope, $modalInstance) {
	$scope.cancel = $modalInstance.dismiss;

	$scope.save = function(goal) {
		console.log(goal);
		return false;
	};
}

function EditGoalCtrl($scope) {

}

function DeleteGoalCtrl($scope) {

}
