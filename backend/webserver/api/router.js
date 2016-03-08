'use strict';

var express = require('express');

module.exports = function(dependencies) {

  var authorizationMW = dependencies('authorizationMW');
  var controller = require('./controller')(dependencies);

  var router = express.Router();

  router.get('/:channel/messages',
    authorizationMW.requiresAPILogin,
    controller.getMessages);

  return router;
};
