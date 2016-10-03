'use strict';

module.exports = function(dependencies, lib, router) {

  let authorizationMW = dependencies('authorizationMW');
  let controller = require('../controllers/conversation')(dependencies, lib);

  router.post('/conversations', authorizationMW.requiresAPILogin, controller.create);

  router.get('/conversations/:id', authorizationMW.requiresAPILogin, controller.getById);
  router.put('/conversations/:id', authorizationMW.requiresAPILogin, controller.update);
  router.delete('/conversations/:id', authorizationMW.requiresAPILogin, controller.remove);

  router.put('/conversations/:id/members', authorizationMW.requiresAPILogin, controller.joinConversation);
  router.delete('/conversations/:id/members', authorizationMW.requiresAPILogin, controller.leaveConversation);

  router.put('/conversations/:id/topic', authorizationMW.requiresAPILogin, controller.updateTopic);

  router.post('/conversations/:id/readed', authorizationMW.requiresAPILogin, controller.markAllMessageOfAConversationReaded);

  router.get('/private', authorizationMW.requiresAPILogin, controller.findPrivateByMembers);

  // deprecated
  router.get('/me/private', authorizationMW.requiresAPILogin, controller.findMyPrivateConversations);
  router.get('/me/conversation', authorizationMW.requiresAPILogin, controller.findMyConversations);
};
