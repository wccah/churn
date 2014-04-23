'use strict';

/* Controllers */

angular.module('myApp.controllers', ['myApp.services', 'restangular'])
  .controller('myController', [
  	"$scope", "$filter", "cardRes", "balRes", "Restangular",
  	function($scope, $filter, cardRes, balRes, resty) {
        var Restangular = resty.all('api');

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
            Restangular.all('cards').getList().then(function(cards) {
                for(var i = 0; i < cards.length;i++) {
                    var x = cards[i];
                    x.newBalance = angular.extend({cardid: x._id}, newBal);
                }
                $scope.cards = cards;
            });
            return;
            $scope.cards = cardRes.query({}, function (xx) {
                angular.forEach(xx, function(x){
                    x.newBalance = angular.extend({cardid: x._id}, newBal);
                });
            });
        };
        cq();

        $scope.saveCard = function(card) {
            var mythen = function() {

            };
            if ( !card._id ) {
                card.post().then(function() {
                    $scope.newCard = angular.extend({}, newCard);
                }).then(mythen);
            } else {
                card.patch().then(mythen);
            }
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

        $scope.saveBalance = function(card, bal) {
            var b = new balRes(bal);
            b.$patch({cardid: bal.cardid}, function(res, headers) {
                var id = headers.location.split(/\//g).pop();
                bal._id = id;
                card.balances.push(bal);
                card.newBalance = angular.extend({cardid: card._id}, newBal);
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
