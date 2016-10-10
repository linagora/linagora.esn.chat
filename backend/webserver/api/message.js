'use strict';

module.exports = function(dependencies, lib, router) {

  const authorizationMW = dependencies('authorizationMW');
  const controller = require('../controllers/message')(dependencies, lib);
  const middleware = require('../middlewares/message')(dependencies, lib);

  router.get('/messages/:id', authorizationMW.requiresAPILogin, middleware.load, middleware.canRead, controller.get);
};
