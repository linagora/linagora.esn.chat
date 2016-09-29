(function() {
  /*eslint strict: [2, "function"]*/
  'use strict';

  angular
    .module('linagora.esn.chat')
    .directive('chatConversationList', chatConversationList);

    function chatConversationList() {
      var directive = {
        restrict: 'E',
        templateUrl: '/chat/views/conversation-list.html',
        scope: {
          channelState: '@',
          types: '='
        },
        controller: chatConversationListController
      };

      return directive;
    }

    chatConversationListController.$inject = ['$scope', 'chatLocalStateService'];

    function chatConversationListController($scope, chatLocalStateService) {
      var self = this;

      self.wanted = wanted;
      self.groups = chatLocalStateService.conversations;
      self.hasWantedConversation = hasWantedConversation;

      function hasWantedConversation() {
        return $scope.groups.some(function(group) {
          return $scope.wanted(group);
        });
      }

      function wanted(conversation) {
        return $scope.types.indexOf(conversation.type) > -1;
      }
    }
})();
