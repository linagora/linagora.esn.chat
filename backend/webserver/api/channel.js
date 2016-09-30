'use strict';

module.exports = function(dependencies, lib, router) {

  let authorizationMW = dependencies('authorizationMW');
  let controller = require('../controllers/channel')(dependencies, lib);

  router.get('/channels', authorizationMW.requiresAPILogin, controller.getChannels);
};
