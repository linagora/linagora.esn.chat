'use strict';

module.exports = function(dependencies, lib, router, moduleName) {

  const authorizationMW = dependencies('authorizationMW');
  const controller = require('../controllers/message')(dependencies, lib);
  const middleware = require('../middlewares/message')(dependencies, lib);
  const conversationMiddleware = require('../middlewares/conversation')(dependencies, lib);
  const moduleMW = dependencies('moduleMW');

  router.all('/messages*',
    authorizationMW.requiresAPILogin,
    moduleMW.requiresModuleIsEnabledInCurrentDomain(moduleName)
  );

  router.get('/messages/:id',
    middleware.load,
    middleware.loadMessageConversation,
    conversationMiddleware.canRead,
    controller.get);

  router.get('/messages',
    controller.search);
};
