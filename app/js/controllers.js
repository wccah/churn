'use strict';

/* Controllers */

angular.module('myApp.controllers', ['myApp.services'])
  .controller('myController', [
  	"$scope", "$filter", "cardRes", "balRes",
  	function($scope, $filter, cardRes, balRes) {
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

        var cq = function () {
            $scope.cards = cardRes.query({}, function (xx) {
                angular.forEach(xx, function(x){
                    x.newBalance = angular.extend({cardid: x._id}, newBal);
                });
            });
        };
        cq();

        $scope.saveCard = function(card) {
            delete card.newBalance;

            cardRes.save(card, function() {
                if(!card._id) {
                    $scope.newCard = angular.extend({}, newCard);
                }
                cq();
            });
        };

        $scope.deleteCard = function(card) {
            cardRes.delete(card, function() {
                cq();
            });
        };

        $scope.showBalances = function(cardid) {
            var card = $filter("filter")($scope.cards, {_id: cardid})[0];

            card.balances = balRes.query({cardid: cardid});
        };

        $scope.saveBalance = function(bal) {
            var b = new balRes(bal);
            b.$save({cardid: bal.cardid}, function() {
                $scope.showBalances(bal.cardid);
            });
        };

        $scope.deleteBalance = function(cardid, balid) {
            var j = {cardid:cardid, _id:balid};
            var b = new balRes(j);
            b.$delete(j, function() {
                $scope.showBalances(cardid);
            })
        };
  }]);
