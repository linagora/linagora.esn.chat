(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .run(runBlock);

  function runBlock(dynamicDirectiveService, DynamicDirective, chatConfiguration) {
    chatConfiguration.get('enabled', true).then(function(isEnabled) {
      if (!isEnabled) {
        return;
      }
      var chatLaunchConversationDynamicDirective = new DynamicDirective(true, 'chat-launch-conversation-button', {
        attributes: [{ name: 'user-id', value: '{{$ctrl.user._id}}' }, { name: 'is-current-user', value: '{{$ctrl.isCurrentUser}}'}, { name: 'object-type', value: '{{$ctrl.objectType}}'}]
      });

      dynamicDirectiveService.addInjection('profile-user-actions', chatLaunchConversationDynamicDirective);
    });
  }
})();
