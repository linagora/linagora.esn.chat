'use strict';

var express = require('express');

module.exports = function(dependencies, lib) {

  var authorizationMW = dependencies('authorizationMW');
  var controller = require('./controller')(dependencies, lib);

  var router = express.Router();

  router.get('/:channel/messages',
    authorizationMW.requiresAPILogin,
    controller.getMessages);

  router.get('/channels',
    authorizationMW.requiresAPILogin,
    controller.getChannels);

  router.get('/channels/:id',
    authorizationMW.requiresAPILogin,
    controller.getChannel);

  router.post('/channels',
    authorizationMW.requiresAPILogin,
    controller.createChannel);

  router.delete('/channels/:id',
    authorizationMW.requiresAPILogin,
    controller.deleteChannel);

  return router;
};
