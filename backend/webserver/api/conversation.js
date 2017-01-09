'use strict';

module.exports = function(dependencies, lib, router) {

  const authorizationMW = dependencies('authorizationMW');
  const controller = require('../controllers/conversation')(dependencies, lib);
  const middleware = require('../middlewares/conversation')(dependencies, lib);
  const messageController = require('../controllers/message')(dependencies, lib);

  router.get('/conversations', authorizationMW.requiresAPILogin, controller.list);
  router.post('/conversations', authorizationMW.requiresAPILogin, middleware.canCreate, controller.create);

  router.get('/conversations/:id', authorizationMW.requiresAPILogin, middleware.load, middleware.canRead, controller.get);
  router.put('/conversations/:id', authorizationMW.requiresAPILogin, middleware.load, middleware.canUpdate, controller.update);
  router.delete('/conversations/:id', authorizationMW.requiresAPILogin, middleware.load, middleware.canRemove, controller.remove);

  router.put('/conversations/:id/members/:user_id',
    authorizationMW.requiresAPILogin,
    middleware.load,
    middleware.loadUser,
    middleware.canJoin,
    controller.joinConversation);

  router.delete('/conversations/:id/members/:user_id',
    authorizationMW.requiresAPILogin,
    middleware.load,
    middleware.loadUser,
    middleware.canLeave,
    controller.leaveConversation);

  router.get('/conversations/:id/messages', authorizationMW.requiresAPILogin, middleware.load, middleware.canRead, messageController.getForConversation);

  router.put('/conversations/:id/topic', authorizationMW.requiresAPILogin, middleware.load, middleware.canUpdate, controller.updateTopic);

  router.post('/conversations/:id/readed', authorizationMW.requiresAPILogin, middleware.load, middleware.canUpdate, controller.markAllMessageOfAConversationReaded);

  router.get('/conversations/:id/attachments',
    authorizationMW.requiresAPILogin,
    middleware.load,
    middleware.canRead,
    messageController.getAttachmentsForConversation);

  router.get('/user/conversations/private', authorizationMW.requiresAPILogin, controller.findMyPrivateConversations);
  router.get('/user/conversations', authorizationMW.requiresAPILogin, controller.findMyConversations);
};
