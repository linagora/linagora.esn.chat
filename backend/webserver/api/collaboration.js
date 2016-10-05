'use strict';

module.exports = function(dependencies, lib, router) {

  const authorizationMW = dependencies('authorizationMW');
  const controller = require('../controllers/collaboration')(dependencies, lib);

  router.get('/collaboration', authorizationMW.requiresAPILogin, controller.findCollaboration);

  router.get('/user/conversations/collaboration', authorizationMW.requiresAPILogin, controller.findMyCollaborationConversations);
};
