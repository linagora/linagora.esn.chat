'use strict';

module.exports = function(dependencies, lib, router) {

  let authorizationMW = dependencies('authorizationMW');
  let controller = require('../controllers/state')(dependencies, lib);

  router.get('/state/:id', authorizationMW.requiresAPILogin, controller.getUserState);
  router.put('/me/state', authorizationMW.requiresAPILogin, controller.setMyState);
};
