(function(angular) {
  'use strict';

  angular.module('linagora.esn.chat').factory('chatConfiguration', chatConfiguration);

  function chatConfiguration(esnConfig) {

    return {
      get: get
    };

    function get(key, defaultValue) {
      return esnConfig('core.modules.linagora.esn.chat.' + key, defaultValue);
    }
  }
})(angular);
