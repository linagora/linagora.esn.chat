'use strict';

module.exports = function(dependencies, lib, router) {

  let authorizationMW = dependencies('authorizationMW');
  let controller = require('../controllers/message')(dependencies, lib);

  router.get('/messages/:id', authorizationMW.requiresAPILogin, controller.getMessage);
  router.get('/:channel/messages', authorizationMW.requiresAPILogin, controller.getMessages);
};
