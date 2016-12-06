(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .factory('ChatRestangular', ChatRestangular);

    ChatRestangular.$inject = ['Restangular'];

    function ChatRestangular(Restangular) {
      return Restangular.withConfig(function(RestangularConfigurer) {
        RestangularConfigurer.setBaseUrl('/chat/api');
        RestangularConfigurer.setFullResponse(true);
      });
    }
})();
