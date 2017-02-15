'use strict';

module.exports = function(dependencies, lib, router) {

  const authorizationMW = dependencies('authorizationMW');
  const controller = require('../controllers/channel')(dependencies, lib);
  const conversationMiddleware = require('../middlewares/conversation')(dependencies, lib);

  router.get('/channels',
    authorizationMW.requiresAPILogin,
    conversationMiddleware.assertDefaultChannels,
    conversationMiddleware.assertUserIsMemberOfDefaultChannels,
    controller.getChannels);
};
