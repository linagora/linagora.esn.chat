'use strict';

module.exports = function(dependencies, lib, router) {

  const authorizationMW = dependencies('authorizationMW');
  const controller = require('../controllers/user-state')(dependencies, lib);

  router.get('/state/:id', authorizationMW.requiresAPILogin, controller.getUserState);

  router.put('/user/state', authorizationMW.requiresAPILogin, controller.setMyState);
};
