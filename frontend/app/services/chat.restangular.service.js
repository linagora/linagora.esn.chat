(function() {
  /*eslint strict: [2, "function"]*/
  /*eslint no-unused-vars: ["error", {"args": "after-used"}]*/
  'use strict';

  angular.module('linagora.esn.chat')
    .factory('ChatRestangular', ChatRestangular);

    ChatRestangular.$inject = ['Restangular'];

    function ChatRestangular(Restangular) {
      return Restangular.withConfig(function(RestangularConfigurer) {
        RestangularConfigurer.setBaseUrl('/chat/api/chat');
        RestangularConfigurer.setFullResponse(true);
      });
    }
})();
