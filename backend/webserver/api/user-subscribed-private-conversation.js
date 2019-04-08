'use strict';

module.exports = function(dependencies, lib, router, moduleName) {

  const authorizationMW = dependencies('authorizationMW');
  const controller = require('../controllers/user-subscribed-private-conversation')(dependencies, lib);
  const moduleMW = dependencies('moduleMW');

  router.all('/user/privateConversations*',
    authorizationMW.requiresAPILogin,
    moduleMW.requiresModuleIsEnabledInCurrentDomain(moduleName)
  );

  router.get('/user/privateConversations',
    controller.get);

  router.put('/user/privateConversations',
   controller.store);
};
