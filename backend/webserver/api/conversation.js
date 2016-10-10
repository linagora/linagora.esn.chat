'use strict';

module.exports = function(dependencies, lib, router) {

  const authorizationMW = dependencies('authorizationMW');
  const controller = require('../controllers/conversation')(dependencies, lib);
  const messageController = require('../controllers/message')(dependencies, lib);

  router.get('/conversations', authorizationMW.requiresAPILogin, controller.list);
  router.post('/conversations', authorizationMW.requiresAPILogin, controller.create);

  router.get('/conversations/:id', authorizationMW.requiresAPILogin, controller.getById);
  router.put('/conversations/:id', authorizationMW.requiresAPILogin, controller.update);
  router.delete('/conversations/:id', authorizationMW.requiresAPILogin, controller.remove);

  router.put('/conversations/:id/members', authorizationMW.requiresAPILogin, controller.joinConversation);
  router.delete('/conversations/:id/members', authorizationMW.requiresAPILogin, controller.leaveConversation);

  router.get('/conversations/:id/messages', authorizationMW.requiresAPILogin, messageController.getForConversation);

  router.put('/conversations/:id/topic', authorizationMW.requiresAPILogin, controller.updateTopic);

  router.post('/conversations/:id/readed', authorizationMW.requiresAPILogin, controller.markAllMessageOfAConversationReaded);

  router.get('/user/conversations/private', authorizationMW.requiresAPILogin, controller.findMyPrivateConversations);
  router.get('/user/conversations', authorizationMW.requiresAPILogin, controller.findMyConversations);
};
