'use strict';

module.exports = function(dependencies, lib, router) {

  const authorizationMW = dependencies('authorizationMW');
  const controller = require('../controllers/collaboration')(dependencies, lib);
  const conversationController = require('../controllers/conversation')(dependencies, lib);
  const middleware = require('../middlewares/collaboration')(dependencies, lib);

  router.get('/collaborations/conversations/:objectType/:id',
    authorizationMW.requiresAPILogin,
    middleware.loadCollaboration,
    middleware.hasPermission,
    middleware.loadConversation,
    conversationController.get);

  router.get('/user/collaborations/conversations',
    authorizationMW.requiresAPILogin,
    controller.listConversationsForUser);
};
