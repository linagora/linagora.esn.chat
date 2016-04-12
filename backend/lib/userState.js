'use strict';

var Q = require('q');
var _ = require('lodash');

module.exports = function(dependencies) {

  var redisPromise = Q.ninvoke(dependencies('db').redis, 'getClient');

  var USER_STATE_KEY_PREFIX = 'userState:';

  var pubsubLocal = dependencies('pubsub').local;
  var pubsubGlobal = dependencies('pubsub').global;

  var userStateTopic = pubsubGlobal.topic('user:state');
  var userConnectionTopic = pubsubLocal.topic('user:connection');
  var userDisconnectionTopic = pubsubLocal.topic('user:disconnection');

  var DISCONNECTED = 'disconnected';

  //in minisecond
  var DISCONNECTION_DELAY = 10000;

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
        if (!(data && data.previousState)) {
          return;
        }

        return set(userId, data.previousState);
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

  userConnectionTopic.subscribe(restorePreviousState);

  userDisconnectionTopic.subscribe(_.partialRight(set, 'disconnected', DISCONNECTION_DELAY));

  userStateTopic.subscribe(function(data) {
    console.log('___________________ Todo socket io this data', data);
  });

  return {
    set: set,
    get: get,
    restorePreviousState: restorePreviousState,
    getAll: getAll
  };
};
