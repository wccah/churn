'use strict';

/* Controllers */

angular.module('myApp.controllers', [])
  .controller('MyCtrl1', [
  	"$scope", 
  	function($scope) {
		$scope.cards = [{name:"USAir"}];
  }]);
