'use strict';

module.exports = function(dependencies, lib, router, moduleName) {

  const authorizationMW = dependencies('authorizationMW');
  const collaborationMW = dependencies('collaborationMW');
  const controller = require('../controllers/conversation')(dependencies, lib);
  const middleware = require('../middlewares/conversation')(dependencies, lib);
  const messageController = require('../controllers/message')(dependencies, lib);
  const moduleMW = dependencies('moduleMW');

  router.all('/conversations*',
    authorizationMW.requiresAPILogin,
    moduleMW.requiresModuleIsEnabledInCurrentDomain(moduleName)
  );

  router.all('/user/conversations*',
  authorizationMW.requiresAPILogin,
  moduleMW.requiresModuleIsEnabledInCurrentDomain(moduleName)
);

  router.get('/conversations',
    middleware.assertDefaultChannels,
    middleware.assertUserIsMemberOfDefaultChannels,
    controller.list);

  router.post('/conversations', middleware.canCreate, controller.create);

  router.get('/conversations/:id', middleware.load, middleware.canRead, controller.get);
  router.put('/conversations/:id', middleware.load, middleware.canUpdate, controller.update);

  router.get('/conversations/:id/messages', middleware.load, middleware.canRead, messageController.getForConversation);

  router.put('/conversations/:id/topic', middleware.load, middleware.canUpdate, controller.updateTopic);

  router.post('/conversations/:id/readed',
    middleware.load,
    middleware.canUpdate,
    controller.markUserAsReadAllMessages);

  router.get('/conversations/:id/summary',
    middleware.load,
    middleware.canRead,
    controller.getSummaryOfConversation);

  router.get('/conversations/:id/attachments',
    middleware.load,
    middleware.canRead,
    messageController.getAttachmentsForConversation);

  router.post('/conversations/:id/archive',
    middleware.load,
    middleware.canArchive,
    controller.archive);

  router.put('/conversations/:id/members/:member_id',
    middleware.load,
    collaborationMW.load,
    collaborationMW.requiresCollaborationMember,
    controller.addMember);

  router.get('/user/conversations/private',
    middleware.assertDefaultChannels,
    middleware.assertUserIsMemberOfDefaultChannels,
    controller.getUserPrivateConversations);

  router.get('/user/conversations',
    middleware.assertDefaultChannels,
    middleware.assertUserIsMemberOfDefaultChannels,
    controller.getUserConversations);
};
