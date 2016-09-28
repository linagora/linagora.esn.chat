'use strict';

module.exports = function(dependencies, lib, router) {
  let authorizationMW = dependencies('authorizationMW');
  let controller = require('../controllers/community')(dependencies, lib);

  router.get('/community', authorizationMW.requiresAPILogin, controller.findCommunity);
  router.get('/me/community', authorizationMW.requiresAPILogin, controller.findMyCommunityConversations);

};
