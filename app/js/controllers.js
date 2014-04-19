'use strict';

/* Controllers */

angular.module('myApp.controllers', ['myApp.services'])
  .controller('myController', [
  	"$scope", "cardRes", "balRes",
  	function($scope, cardRes, balRes) {
        var newCard = {
            name: 'New Card',
            deadline: new Date(),
            reward: 1,
            rewardUnit: 'Miles?',
            minSpend: 1
        };

        var newBal = {
            asOf: new Date(),
            amount: 0
        };

        $scope.newCard = angular.extend({}, newCard);
        $scope.newBalance = angular.extend({}, newBal);

        $scope.cards = cardRes.query();

        $scope.saveCard = function(card) {
            var ssave = function () {
                delete card.balances;

                cardRes.save(card, function(){
                    $scope.newCard = angular.extend({}, newCard);
                    $scope.cards = cardRes.query();
                });
            };

            if (! angular.equals(newBal, $scope.newBalance)){
                $scope.newBalance.cardid = card._id;
                balRes.save($scope.newBalance, function(){
                    $scope.newBalance = angular.extend({}, newBal);
                    ssave();
                });
            } else {
                ssave();
            }


        };

        $scope.deleteCard = function(card) {
            cardRes.delete(card, function() {
                $scope.cards = cardRes.query();
            });
        };


  }]);
