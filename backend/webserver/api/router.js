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

  router.put('/channels/:id/members',
    authorizationMW.requiresAPILogin,
    controller.joinChannel);

  router.get('/groups',
    authorizationMW.requiresAPILogin,
    controller.findGroupByMembers);

  router.get('/me/groups',
    authorizationMW.requiresAPILogin,
    controller.findMyUsersGroups);

  router.get('/state/:id',
    authorizationMW.requiresAPILogin,
    authorizationMW.requiresAPILogin,
    controller.getUserState);

  router.put('/me/state',
    authorizationMW.requiresAPILogin,
    controller.setMyState);

  router.delete('/channels/:id/members',
    authorizationMW.requiresAPILogin,
    controller.leaveChannel);

  router.delete('/channels/:id',
    authorizationMW.requiresAPILogin,
    controller.deleteChannel);

  router.put('/channels/:id/topic',
    authorizationMW.requiresAPILogin,
    controller.updateTopic);

  return router;
};
