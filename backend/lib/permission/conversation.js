'use strict';

const Q = require('q');
const _ = require('lodash');

module.exports = function(dependencies) {

  let readPermissions = {
    channel: userCanReadChannel,
    private: userCanReadPrivate,
    collaboration: userCanReadCollaboration
  };

  let updatePermissions = {
    channel: userCanUpdateChannel,
    private: userCanUpdatePrivate,
    collaboration: userCanUpdateCollaboration
  };

  return {
    userCanRead,
    userCanUpdate
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
    return userIsInConversationMemberList(user, conversation);
  }

  function userCanReadCollaboration(user, conversation) {
    return Q.when(false);
  }

  function userCanUpdate(user, conversation) {
    const updatePermission = updatePermissions[conversation.type];

    if (!updatePermission) {
      return Q.reject(new Error(`Can not find update permission checked for type ${conversation.type}`));
    }

    return updatePermission(user, conversation);
  }

  function userCanUpdateChannel(user, conversation) {
    return Q.when(true);
  }

  function userCanUpdatePrivate(user, conversation) {
    return userIsInConversationMemberList(user, conversation);
  }

  function userCanUpdateCollaboration(user, conversation) {
    return Q.when(false);
  }

  function userIsInConversationMemberList(user, conversation) {
    let member = _.find(conversation.members, element => element._id.equals(user._id));

    return Q.when(!!member);
  }

};
