'use strict';

module.exports = function(dependencies, lib, router) {

  const authorizationMW = dependencies('authorizationMW');
  const controller = require('../controllers/user-subscribed-private-conversation')(dependencies, lib);

  router.get('/user/privateConversations',
    authorizationMW.requiresAPILogin,
    controller.get);

  router.put('/user/privateConversations',
   authorizationMW.requiresAPILogin,
   controller.store);
};
