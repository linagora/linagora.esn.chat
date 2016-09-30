(function() {
  /*eslint strict: [2, "function"]*/
  'use strict';

  angular
    .module('linagora.esn.chat')
    .factory('chatHumanizeEntitiesLabel', chatHumanizeEntitiesLabel);

  function chatHumanizeEntitiesLabel(_) {
    var humanPresentation = {};

    return {
      reset: reset,
      addHumanRepresentation: addHumanRepresentation,
      replaceHumanPresentationByRealData: replaceHumanPresentationByRealData
    };

    function reset() {
      humanPresentation = {};
    }

    function addHumanRepresentation(humanLabel, realValue) {
      var i = 1;
      var definitiveHumanLabel = humanLabel;

      while (humanPresentation[definitiveHumanLabel] && humanPresentation[definitiveHumanLabel] !== realValue) {
        definitiveHumanLabel = humanLabel + String(i);
        i++;
      }

      humanPresentation[definitiveHumanLabel] = realValue;

      return definitiveHumanLabel;
    }

    function replaceHumanPresentationByRealData(string) {
      var result = string;

      _.chain(humanPresentation).pairs().sortBy(function(pair) {
        return -pair[0].length;
      }).each(function(pair) {
        var humanValue = pair[0], realValue = pair[1];

        result = result.replace(new RegExp(humanValue, 'g'), realValue);
      });

      return result;
    }
  }
})();
