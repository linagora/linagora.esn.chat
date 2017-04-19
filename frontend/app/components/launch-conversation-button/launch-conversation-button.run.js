(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .run(runBlock);

  function runBlock(dynamicDirectiveService, DynamicDirective) {
    var chatLaunchConversationDynamicDirective = new DynamicDirective(true, 'chat-launch-conversation-button', {
      attributes: [{ name:'user-id', value:'{{user._id}}' }]
    });

    dynamicDirectiveService.addInjection('profile-user-actions', chatLaunchConversationDynamicDirective);
  }
})();
