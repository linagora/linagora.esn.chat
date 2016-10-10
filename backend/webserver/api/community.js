'use strict';

module.exports = function(dependencies, lib, router) {

  const authorizationMW = dependencies('authorizationMW');
  const controller = require('../controllers/community')(dependencies, lib);

  router.get('/community', authorizationMW.requiresAPILogin, controller.findCommunity);

  router.get('/user/conversations/community', authorizationMW.requiresAPILogin, controller.findMyCommunityConversations);
};
