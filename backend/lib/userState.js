'use strict';

var Q = require('q');
var _ = require('lodash');
var CONSTANTS = require('../lib/constants');
var USER_STATE = CONSTANTS.NOTIFICATIONS.USER_STATE;
var USER_CONNECTION = CONSTANTS.NOTIFICATIONS.USER_CONNECTION;
var USER_DISCONNECTION = CONSTANTS.NOTIFICATIONS.USER_DISCONNECTION;

module.exports = function(dependencies) {

  var redisPromise = Q.ninvoke(dependencies('db').redis, 'getClient');

  var USER_STATE_KEY_PREFIX = 'userState:';

  var pubsubLocal = dependencies('pubsub').local;
  var pubsubGlobal = dependencies('pubsub').global;

  var userStateTopic = pubsubGlobal.topic(USER_STATE);
  var userConnectionTopic = pubsubLocal.topic(USER_CONNECTION);
  var userDisconnectionTopic = pubsubLocal.topic(USER_DISCONNECTION);

  var DISCONNECTED = CONSTANTS.STATUS.DISCONNECTED;
  var DEFAULT_CONNECTED_STATE = CONSTANTS.STATUS.DEFAULT_CONNECTED_STATE;

  var DISCONNECTION_DELAY = CONSTANTS.STATUS.DISCONNECTION_DELAY;

  var delayedStateChanges = {};

  function set(userId, state, delay) {
    return redisPromise.then(function(redis) {
      var key = USER_STATE_KEY_PREFIX + userId;
      return Q.ninvoke(redis, 'hgetall', key).then(function(previousData) {
        var data = {
          state: state,
          since: Date.now(),
          delay: delay || 0
        };

        if (state === DISCONNECTED && previousData) {
          data.previousState = previousData.state === DISCONNECTED ? previousData.previousState : previousData.state;
        }

        if ((data.state) !== (previousData && previousData.state || DISCONNECTED)) {

          delayedStateChanges[userId] && clearTimeout(delayedStateChanges[userId]);
          if (delay) {
            delayedStateChanges[userId] = setTimeout(function() {
              userStateTopic.publish({
                userId: userId,
                state: state
              });
              delete delayedStateChanges[userId];
            }, delay);
          } else {
            userStateTopic.publish({
              userId: userId,
              state: state
            });
          }
        }

        return Q.ninvoke(redis, 'hmset', key, data);
      });
    });
  }

  function restorePreviousState(userId) {
    return redisPromise.then(function(redis) {
      return Q.ninvoke(redis, 'hgetall', USER_STATE_KEY_PREFIX + userId).then(function(data) {
        return set(userId, data && data.previousState || DEFAULT_CONNECTED_STATE);
      });
    });
  }

  function get(userId) {
    return redisPromise.then(function(redis) {
      return Q.ninvoke(redis, 'hgetall', USER_STATE_KEY_PREFIX + userId).then(function(data) {

        if (!data) {
          return DISCONNECTED;
        }

        if ((Date.now() - data.since) < data.delay) {
          return data.previousState || DISCONNECTED;
        }

        return data.state;
      });
    });
  }

  function getAll(userIds) {
    return Q.all(userIds.map(get));
  }

  function init() {
    userConnectionTopic.subscribe(restorePreviousState);
    userDisconnectionTopic.subscribe(_.partialRight(set, DISCONNECTED, DISCONNECTION_DELAY));
  }

  return {
    set: set,
    get: get,
    init: init,
    restorePreviousState: restorePreviousState,
    getAll: getAll
  };
};
