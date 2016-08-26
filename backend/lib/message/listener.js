'use strict';

var CONSTANTS = require('../constants');
var CONVERSATION_TYPE = CONSTANTS.CONVERSATION_TYPE;
var _ = require('lodash');

module.exports = function(dependencies) {

  var localPubsub = dependencies('pubsub').local;
  var globalPubsub = dependencies('pubsub').global;
  var logger = dependencies('logger');

  var mongoose = dependencies('db').mongo.mongoose;
  var ChatMessage = mongoose.model('ChatMessage');
  var messageHandlers = [];

  function addHandler(handler) {
    handler && messageHandlers.push(handler);
  }

  function handleMessage(data) {
    messageHandlers.map(function(handler) {
      try {
        handler(data);
      } catch (err) {
        logger.warn('Error while handling message', err);
      }
    });
  }

  function start(conversationLib) {
    addHandler(require('./handlers/first')(dependencies));
    addHandler(require('./handlers/mentions')(dependencies));

    function saveAsChatMessage(data, callback) {
      conversationLib.getConversation(data.message.channel._id || data.message.channel, function(err, conversation) {
        if (err) {
          return callback(err);
        }

        if (!_.find(conversation.members, function(member) {
          return String(member._id) === String(data.message.creator._id || data.message.creator);
        })) {
          return callback('The user is not into the conversation');
        }

        var chatMessage = {
          type: data.message.type,
          text: data.message.text,
          date: data.message.date,
          creator: data.message.creator,
          channel: data.message.channel
        };

        if (data.message.attachments) {
          chatMessage.attachments = data.message.attachments;
        }

        conversationLib.createMessage(chatMessage, callback);
      });
    }

    function populateTypingMessage(data, callback) {
      (new ChatMessage(data)).populate('creator', function(err, message) {
        if (err) {
          callback(err);
          return;
        }
        var result = message.toJSON();

        result.state = data.state;
        callback(null, result);
      });
    }

    localPubsub.topic(CONSTANTS.NOTIFICATIONS.COMMUNITY_CREATED).subscribe(function(community) {
      var conversation = {
        type: CONVERSATION_TYPE.COMMUNITY,
        name: community.title,
        creator: community.creator,
        community: community._id,
        members: _.chain(community.members).map('member').filter({objectType: 'user'}).map('id').value()
      };

      conversationLib.createConversation(conversation);
    });

    localPubsub.topic(CONSTANTS.NOTIFICATIONS.MEMBER_ADDED_IN_COMMUNITY).subscribe(function(data) {
      var community = data.target;
      var newMember = data.member;

      if (newMember.objectType !== 'user') {
        return;
      }

      conversationLib.getCommunityConversationByCommunityId(community.id, function(err, conversation) {
        if (err) {
          logger.error('Can not get associated conversation', err);

          return;
        }

        conversationLib.addMemberToConversation(conversation._id, newMember.id, function(err) {
          if (err) {
            logger.error('Could not add member to the conversation', err);
          }
        });
      });
    });

    localPubsub.topic(CONSTANTS.NOTIFICATIONS.COMMUNITY_UPDATE).subscribe(function(data) {
      conversationLib.updateCommunityConversation(data.community._id, data.modifications, function(err, conversation) {
        if (err) {
          logger.error('Could not update community conversation', err);
        }

        globalPubsub.topic(CONSTANTS.NOTIFICATIONS.CONVERSATION_UPDATE).publish({
          conversation: conversation,
          deleteMembers: data.modifications.deleteMembers
        });
      });
    });

    localPubsub.topic(CONSTANTS.NOTIFICATIONS.MESSAGE_RECEIVED).subscribe(function(data) {
      if (data.message.type === 'user_typing') {
        populateTypingMessage(data.message, function(err, message) {
          if (err) {
            logger.error('Can not populate user typing message', err);
            return;
          }
          globalPubsub.topic(CONSTANTS.NOTIFICATIONS.MESSAGE_RECEIVED).publish({room: data.room, message: message});
        });
      } else {
        saveAsChatMessage(data, function(err, message) {
          if (err) {
            logger.error('Can not save ChatMessage', err);
            return;
          }
          logger.debug('Chat Message saved', message);
          globalPubsub.topic(CONSTANTS.NOTIFICATIONS.MESSAGE_RECEIVED).publish({room: data.room, message: message});

          handleMessage({message: message, room: data.room});
        });
      }
    });
  }

  return {
    start: start,
    addHandler: addHandler,
    handleMessage: handleMessage
  };
};
