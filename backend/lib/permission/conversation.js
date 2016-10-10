'use strict';

const Q = require('q');
const _ = require('lodash');

module.exports = function(dependencies) {

  let readPermissions = {
    channel: userCanReadChannel,
    private: userCanReadPrivate,
    collaboration: userCanReadCollaboration
  };

  return {
    userCanRead
  };

  function userCanRead(user, conversation) {
    const readPermission = readPermissions[conversation.type];

    if (!readPermission) {
      return Q.reject(new Error(`Can not find permission checked for type ${conversation.type}`));
    }

    return readPermission(user, conversation);
  }

  function userCanReadChannel(user, conversation) {
    // a user can read a channel in all the cases
    return Q.when(true);
  }

  function userCanReadPrivate(user, conversation) {
    let member = _.find(conversation.members, element => element._id.equals(user._id));

    return Q.when(!!member);
  }

  function userCanReadCollaboration(user, conversation) {
    return Q.when(false);
  }
};
