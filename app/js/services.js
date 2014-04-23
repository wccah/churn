(function(angular) {
    'use strict';

/* Services */
var regexIso8601 = /^(\d{4}|\+\d{6})(?:-(\d{2})(?:-(\d{2})(?:T(\d{2}):(\d{2}):(\d{2})\.(\d{1,})(Z|([\-+])(\d{2}):(\d{2}))?)?)?)?$/;

function convertDateStringsToDates(input) {
    // Ignore things that aren't objects.
    if (typeof input !== "object") return input;

    for (var key in input) {
        if (!input.hasOwnProperty(key)) continue;

        var value = input[key];
        var match;
        // Check for string properties which look like dates.
        if (typeof value === "string" && (match = value.match(regexIso8601))) {
            var milliseconds = Date.parse(match[0]);
            if (!isNaN(milliseconds)) {
                input[key] = new Date(milliseconds);
            }
        } else if (typeof value === "object") {
            // Recurse into object
            convertDateStringsToDates(value);
        }
    }
}

    var origParse = Date.parse, numericKeys = [ 1, 4, 5, 6, 7, 10, 11 ];
    Date.parse = function (date) {
        var timestamp, struct, minutesOffset = 0;

        // ES5 §15.9.4.2 states that the string should attempt to be parsed as a Date Time String Format string
        // before falling back to any implementation-specific date parsing, so that’s what we do, even if native
        // implementations could be faster
        //              1 YYYY                2 MM       3 DD           4 HH    5 mm       6 ss        7 msec        8 Z 9 ±    10 tzHH    11 tzmm
        if ((struct = /^(\d{4}|[+\-]\d{6})(?:-(\d{2})(?:-(\d{2}))?)?(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{3}))?)?(?:(Z)|([+\-])(\d{2})(?::(\d{2}))?)?)?$/.exec(date))) {
            // avoid NaN timestamps caused by “undefined” values being passed to Date.UTC
            for (var i = 0, k; (k = numericKeys[i]); ++i) {
                struct[k] = +struct[k] || 0;
            }

            // allow undefined days and months
            struct[2] = (+struct[2] || 1) - 1;
            struct[3] = +struct[3] || 1;

            if (struct[8] !== 'Z' && struct[9] !== undefined) {
                minutesOffset = struct[10] * 60 + struct[11];

                if (struct[9] === '+') {
                    minutesOffset = 0 - minutesOffset;
                }
            }

            if (struct[4]===0 && struct[5]===0 && struct[6]===0 && struct[7]===0) {
                timestamp = (new Date(struct[1], struct[2], struct[3])).getTime();
            } else {
                timestamp = Date.UTC(struct[1], struct[2], struct[3], struct[4], struct[5] + minutesOffset, struct[6], struct[7]);
            }
        }
        else {
            timestamp = origParse ? origParse(date) : NaN;
        }

        return timestamp;
    };

    angular.module('myApp.services', ['ngResource'])
        .value('version', '0.1')
        .config(["$httpProvider", function ($httpProvider) {
            $httpProvider.defaults.transformResponse.push(function(responseData){
                convertDateStringsToDates(responseData);
                return responseData;
            });
        }])
        .factory('cardRes', ['$resource',
            function($resource) {
                return $resource('/api/cards/:_id', {
                    patch: { method: 'PATCH' }
                });
            }])
        .factory('balRes', ['$resource',
            function($resource){
                return $resource('/api/cards/:cardid/balances/:_id', {
                    patch: { method: 'PATCH'}
                });
            }]);
})(angular);