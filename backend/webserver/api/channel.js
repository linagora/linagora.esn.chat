'use strict';

module.exports = function(dependencies, lib, router) {

  const authorizationMW = dependencies('authorizationMW');
  const controller = require('../controllers/channel')(dependencies, lib);

  router.get('/channels', authorizationMW.requiresAPILogin, controller.getChannels);
};
