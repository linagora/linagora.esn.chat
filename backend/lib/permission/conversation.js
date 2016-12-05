'use strict';

const Q = require('q');
const _ = require('lodash');

module.exports = function(dependencies) {

  const collaborationModule = dependencies('collaboration');

  const readPermissions = {
    channel: userCanReadChannel,
    private: userCanReadPrivate,
    collaboration: userCanReadCollaboration
  };

  const updatePermissions = {
    channel: userCanUpdateChannel,
    private: userCanUpdatePrivate,
    collaboration: userCanUpdateCollaboration
  };

  const removePermissions = {
    channel: userCanRemoveChannel,
    private: userCanRemovePrivate,
    collaboration: userCanRemoveCollaboration
  };

  const joinPermissions = {
    channel: userCanJoinChannel,
    private: userCanJoinPrivate,
    collaboration: userCanJoinCollaboration
  };

  const leavePermissions = {
    channel: userCanLeaveChannel,
    private: userCanLeavePrivate,
    collaboration: userCanLeaveCollaboration
  };

  const writePermissions = {
    channel: userCanWriteChannel,
    private: userCanWritePrivate,
    collaboration: userCanWriteCollaboration
  };

  return {
    userCanJoin,
    userCanLeave,
    userCanRead,
    userCanRemove,
    userCanUpdate,
    userCanWrite
  };

  function userCanJoin(actor, user, conversation) {
    const joinPermission = joinPermissions[conversation.type];

    if (!joinPermission) {
      return Q.reject(new Error(`Can not find permission checked for type ${conversation.type}`));
    }

    return joinPermission(actor, user, conversation);
  }

  function userCanJoinChannel(actor, user, conversation) {
    // 1. A user can add himself
    if (actor._id.equals(user._id)) {
      return Q.when(true);
    }

    // 2. anyone who is member of the channel can add anyone to the conversation
    return userIsInConversationMemberList(actor, conversation);
  }

  function userCanJoinPrivate(actor, user, conversation) {
    // only a member can add another user to a private conversation
    return userIsInConversationMemberList(actor, conversation);
  }

  function userCanJoinCollaboration() {
    return Q.when(false);
  }

  function userCanLeave(actor, user, conversation) {
    const leavePermission = leavePermissions[conversation.type];

    if (!leavePermission) {
      return Q.reject(new Error(`Can not find permission checked for type ${conversation.type}`));
    }

    return leavePermission(actor, user, conversation);
  }

  function userCanLeaveChannel(actor, user, conversation) {
    // 1. A user can leave himself
    if (actor._id.equals(user._id)) {
      return Q.when(true);
    }

    // 2. any member can kick away anyone
    return userIsInConversationMemberList(actor, conversation);
  }

  function userCanLeavePrivate(actor, user, conversation) {
    // 1. conversation creator can remove any user
    if (actor._id.equals(conversation.creator)) {
      return Q.when(true);
    }

    // 2. member can remove himself
    return Q.when(actor._id.equals(user._id));
  }

  function userCanLeaveCollaboration() {
    return Q.when(false);
  }

  function userCanRead(user, conversation) {
    const readPermission = readPermissions[conversation.type];

    if (!readPermission) {
      return Q.reject(new Error(`Can not find permission checked for type ${conversation.type}`));
    }

    return readPermission(user, conversation);
  }

  function userCanReadChannel() {
    // a user can read a channel in all the cases
    return Q.when(true);
  }

  function userCanReadPrivate(user, conversation) {
    return userIsInConversationMemberList(user, conversation);
  }

  function userCanReadCollaboration() {
    return Q.when(false);
  }

  function userCanRemove(user, conversation) {
    const removePermission = removePermissions[conversation.type];

    if (!removePermission) {
      return Q.reject(new Error(`Can not find remove permission for type ${conversation.type}`));
    }

    return removePermission(user, conversation);
  }

  function userCanRemoveChannel() {
    // TBD
    return Q.when(false);
  }

  function userCanRemovePrivate(user, conversation) {
    return userIsInConversationMemberList(user, conversation);
  }

  function userCanRemoveCollaboration() {
    return Q.when(false);
  }

  function userCanUpdate(user, conversation) {
    const updatePermission = updatePermissions[conversation.type];

    if (!updatePermission) {
      return Q.reject(new Error(`Can not find update permission checked for type ${conversation.type}`));
    }

    return updatePermission(user, conversation);
  }

  function userCanUpdateChannel() {
    return Q.when(true);
  }

  function userCanUpdatePrivate(user, conversation) {
    return userIsInConversationMemberList(user, conversation);
  }

  function userCanUpdateCollaboration() {
    return Q.when(false);
  }

  function userCanWrite(user, conversation) {
    const writePermission = writePermissions[conversation.type];

    if (!writePermission) {
      return Q.reject(new Error(`Can not find write permission checked for type ${conversation.type}`));
    }

    return writePermission(user, conversation);
  }

  function userCanWriteChannel(user, conversation) {
    return userIsInConversationMemberList(user, conversation);
  }

  function userCanWritePrivate(user, conversation) {
    return userIsInConversationMemberList(user, conversation);
  }

  function userCanWriteCollaboration(user, conversation) {

    return getCollaboration().then(canWrite);

    function canWrite(collaboration) {
      return Q.denodeify(collaborationModule.permission.canWrite)(collaboration, {id: String(user._id), objectType: 'user'});
    }

    function getCollaboration() {
      return Q.denodeify(collaborationModule.queryOne)(conversation.collaboration.objectType, {_id: conversation.collaboration.id}).then(collaboration => {
        if (!collaboration) {
          return Q.reject(new Error('Collaboration not found'));
        }

        return collaboration;
      });
    }
  }

  function userIsInConversationMemberList(user, conversation) {
    const member = _.find(conversation.members, element => element._id.equals(user._id));

    return Q.when(!!member);
  }

};
