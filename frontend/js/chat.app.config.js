'use strict';

angular.module('linagora.esn.chat')
.config(function(dynamicDirectiveServiceProvider) {
  var chatItem = new dynamicDirectiveServiceProvider.DynamicDirective(true, 'chat-application-menu', {priority: 35});
  dynamicDirectiveServiceProvider.addInjection('esn-application-menu', chatItem);
});
