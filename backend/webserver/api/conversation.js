'use strict';

module.exports = function(dependencies, lib, router) {

  const authorizationMW = dependencies('authorizationMW');
  const collaborationMW = dependencies('collaborationMW');
  const controller = require('../controllers/conversation')(dependencies, lib);
  const middleware = require('../middlewares/conversation')(dependencies, lib);
  const messageController = require('../controllers/message')(dependencies, lib);

  router.get('/conversations',
    authorizationMW.requiresAPILogin,
    middleware.assertDefaultChannels,
    middleware.assertUserIsMemberOfDefaultChannels,
    controller.list);

  router.post('/conversations', authorizationMW.requiresAPILogin, middleware.canCreate, controller.create);

  router.get('/conversations/:id', authorizationMW.requiresAPILogin, middleware.load, middleware.canRead, controller.get);
  router.put('/conversations/:id', authorizationMW.requiresAPILogin, middleware.load, middleware.canUpdate, controller.update);

  router.get('/conversations/:id/messages', authorizationMW.requiresAPILogin, middleware.load, middleware.canRead, messageController.getForConversation);

  router.put('/conversations/:id/topic', authorizationMW.requiresAPILogin, middleware.load, middleware.canUpdate, controller.updateTopic);

  router.post('/conversations/:id/readed', authorizationMW.requiresAPILogin, middleware.load, middleware.canUpdate, controller.markAllMessageOfAConversationReaded);

  router.get('/conversations/:id/summary',
    middleware.load,
    middleware.canRead,
    controller.getSummaryOfConversation);

  router.get('/conversations/:id/attachments',
    authorizationMW.requiresAPILogin,
    middleware.load,
    middleware.canRead,
    messageController.getAttachmentsForConversation);

  router.put('/conversations/:id/members/:member_id',
    authorizationMW.requiresAPILogin,
    middleware.load,
    collaborationMW.load,
    collaborationMW.requiresCollaborationMember,
    controller.addMember);

  router.get('/user/conversations/private',
    authorizationMW.requiresAPILogin,
    middleware.assertDefaultChannels,
    middleware.assertUserIsMemberOfDefaultChannels,
    controller.getUserPrivateConversations);

  router.get('/user/conversations',
    authorizationMW.requiresAPILogin,
    middleware.assertDefaultChannels,
    middleware.assertUserIsMemberOfDefaultChannels,
    controller.getUserConversations);
};
