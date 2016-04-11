'use strict';

var Q = require('q');

module.exports = function(dependencies) {

  var redisPromise = Q.ninvoke(dependencies('db').redis, 'getClient');

  var USER_STATE_KEY_PREFIX = 'userState:';

  var DISCONNECTED = 'disconnected';

  function set(userId, state, delay) {
    return redisPromise.then(function(redis) {
      var data = {
        state: state,
        since: Date.now(),
        delay: delay || 0
      };

      var key = USER_STATE_KEY_PREFIX + userId;
      if (state === DISCONNECTED) {
        return Q.ninvoke(redis, 'hgetall', key).then(function(previousData) {
          data.previousState = previousData.state === DISCONNECTED ? previousData.previousState : previousData.state;
          return Q.ninvoke(redis, 'hmset', key, data);
        });
      } else {
        return Q.ninvoke(redis, 'hmset', key, data);
      }
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

  return {
    set: set,
    get: get,
    restorePreviousState: restorePreviousState,
    getAll: getAll
  };
};
