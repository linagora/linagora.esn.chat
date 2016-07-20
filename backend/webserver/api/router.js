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

  router.get('/conversations/:id',
    authorizationMW.requiresAPILogin,
    controller.getConversation);

  router.post('/conversations',
    authorizationMW.requiresAPILogin,
    controller.createConversation);

  router.put('/conversations/:id/members',
    authorizationMW.requiresAPILogin,
    controller.joinConversation);

  router.get('/private',
    authorizationMW.requiresAPILogin,
    controller.findPrivateByMembers);

  router.get('/me/private',
    authorizationMW.requiresAPILogin,
    controller.findMyUsersGroups);

  router.get('/state/:id',
    authorizationMW.requiresAPILogin,
    authorizationMW.requiresAPILogin,
    controller.getUserState);

  router.put('/me/state',
    authorizationMW.requiresAPILogin,
    controller.setMyState);

  router.delete('/conversations/:id/members',
    authorizationMW.requiresAPILogin,
    controller.leaveConversation);

  router.delete('/conversations/:id',
    authorizationMW.requiresAPILogin,
    controller.deleteConversation);

  router.put('/conversations/:id/topic',
    authorizationMW.requiresAPILogin,
    controller.updateTopic);

  return router;
};
