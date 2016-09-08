'use strict';

var _ = require('lodash');
var CONSTANTS = require('../../lib/constants');
var moderation = require('../../lib/moderation');
var CONVERSATION_TYPE = CONSTANTS.CONVERSATION_TYPE;

module.exports = function(dependencies, lib) {

  function getMessages(req, res) {
    lib.conversation.getMessages(req.params.channel, {}, function(err, results) {
      if (err) {
        return res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details: err.message || 'Error while getting messages'
          }
        });
      }

      return res.status(200).json(moderation.filterModeratedMessages(results));
    });
  }

  function moderationCheck(object, res) {
    if (moderation.isModerated(object)) {
      return {
        status: 403,
        json: {
          error: {
            code: 403,
            message: 'Forbidden',
            details: 'Resource has been moderated'
          }
        }
      };
    }
    return {
      status: 200,
      json: object
    };
  }

  function getMessage(req, res) {
    lib.conversation.getMessage(req.params.id, function(err, message) {
      if (err) {
        return res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details: err.message || 'Error while getting message'
          }
        });
      }

      var response = moderationCheck(message, res);
      return res.status(response.status).json(response.json);
    });
  }

  function getChannels(req, res) {
    lib.conversation.getChannels({}, function(err, channels) {
      if (err) {
        return res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details: err.message || 'Error while getting channels'
          }
        });
      }
      res.status(200).json(moderation.filterModeratedConversations(channels));
    });
  }

  function getConversation(req, res) {
    lib.conversation.getConversation(req.params.id, function(err, conversation) {
      if (err) {
        return res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details: err.message || 'Error while getting channel'
          }
        });
      }

      var response = moderationCheck(conversation, res);
      return res.status(response.status).json(response.json);
    });
  }

  function deleteConversation(req, res) {
    lib.conversation.deleteConversation(req.user._id, req.params.id, function(err, numDeleted) {
      if (err) {
        return res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details: err.message || 'Error while deleting channel'
          }
        });
      }

      if (!req.params.id) {
        return res.status(400).json({
          error: {
            code: 400,
            message: 'Bad request',
            details: 'You should provide the conversation id'
          }
        });
      }

      if (!numDeleted) {
        return res.status(404).json({
          error: {
            code: 500,
            message: 'Not found',
            details: 'Conversation not found'
          }
        });
      }
      res.status(200).end();
    });
  }

  function createConversation(req, res) {
    var members = [];

    if (req.body.members) {
      members = req.body.members.map(function(member) {
        return _.isString(member) ? member : member._id;
      });
    }

    if (members.indexOf(String(req.user._id)) === -1) {
      members.push(String(req.user._id));
    }

    if (req.body.type === CONVERSATION_TYPE.COMMUNITY) {
      return res.status(403).json({
        error: {
          code: 403,
          message: 'Forbidden',
          details: 'You can not create a community conversation'
        }
      });
    }

    lib.conversation.findConversation({type: CONSTANTS.PRIVATE, exactMembersMatch: true, name: req.body.name ? req.body.name : null, members: members}, function(err, conversations) {
      if (err) {
        return res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details: err.message || 'Error while finding groups with users' + members.join(', ')
          }
        });
      }

      if (conversations && conversations.length > 0) {
        res.status(201).json(conversations[0]);
      } else {
        var conversation = {
          name: req.body.name,
          type: req.body.type,
          creator: req.user,
          topic: {
            value: req.body.topic,
            creator: req.user
          },
          avatar: req.body.avatar,
          members: members,
          purpose: {
            value: req.body.purpose,
            creator: req.user
          }
        };

        lib.conversation.createConversation(conversation, function(err, result) {
          if (err) {
            return res.status(500).json({
              error: {
                code: 500,
                message: 'Server Error',
                details: err.message || 'Error while creating channel'
              }
            });
          }
          res.status(201).json(result);
        });
      }
    });
  }

  function markAllMessageOfAConversationReaded(req, res) {
    lib.conversation.makeAllMessageReadedForAnUser(req.user._id, req.params.id, function(err) {
      if (err) {
        return res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details: err.message || 'Error while marking all messages of channel readed'
          }
        });
      }

      res.status(204).end();
    });
  }

  function joinConversation(req, res) {
    lib.conversation.addMemberToConversation(req.params.id, req.user._id, function(err) {
      if (err) {
        return res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details: err.message || 'Error while joining channel'
          }
        });
      }
      res.status(204).end();
    });
  }

  function leaveConversation(req, res) {
    lib.conversation.removeMemberFromConversation(req.params.id, req.user._id, function(err) {
      if (err) {
        return res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details: err.message || 'Error while leaving channel'
          }
        });
      }
      res.status(204).end();
    });
  }

  function findConversationByTypeAndByMembers(type, req, res) {
    if (!req.query.members) {
      return res.status(400).json({
        error: {
          code: 400,
          message: 'Bad request',
          details: 'members attribute is required'
        }
      });
    }

    var members = _.isArray(req.query.members) ? req.query.members : [req.query.members];

    if (members.indexOf(String(req.user._id)) === -1) {
      members.push(String(req.user._id));
    }

    lib.conversation.findConversation({type: type, ignoreMemberFilterForChannel: true, exactMembersMatch: true, members: members}, function(err, conversations) {
      if (err) {
        return res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details: err.message || 'Error while finding groups with users' + members.join(', ')
          }
        });
      }
      res.status(200).json(moderation.filterModeratedConversations(conversations));
    });
  }

  function findCommunity(req, res) {
    if (req.query.members && req.query.id) {
      return res.status(400).json({
        error: {
          code: 400,
          message: 'Bad request',
          details: 'can not use members and id attribute at the same time'
        }
      });
    }

    if (req.query.members) {
      return findConversationByTypeAndByMembers(CONVERSATION_TYPE.COMMUNITY, req, res);
    }

    if (!req.query.id) {
      return res.status(400).json({
        error: {
          code: 400,
          message: 'Bad request',
          details: 'should provide members or id attribute'
        }
      });
    }

    lib.conversation.getCommunityConversationByCommunityId(req.query.id, function(err, conversation) {
      if (err) {
        return res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details: err.message || 'Error while fetching conversation of group:' + req.query.id
          }
        });
      }

      if (!conversation) {
        return res.status(404).json({
          error: {
            code: 404,
            message: 'Not Found',
            details: 'Community conversation not found'
          }
        });
      }

      if (!_.find(conversation.members, {_id: req.user._id})) {
        return res.status(404).json({
          error: {
            code: 404,
            message: 'Community conversation not found'
          }
        });
      }

      var response = moderationCheck(conversation, res);
      return res.status(response.status).json(response.json);
    });
  }

  function findMyConversationByType(type, req, res) {
    lib.conversation.findConversation({type: type, ignoreMemberFilterForChannel: true, members: [String(req.user._id)]}, function(err, conversations) {
      if (err) {
        return res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details: err.message || 'Error while finding groups of user ' + req.user._id
          }
        });
      }
      res.status(200).json(moderation.filterModeratedConversations(conversations));
    });
  }

  function findMyConversations(req, res)  {
    return findMyConversationByType(req.query.type, req, res);
  }

  function getUserState(req, res) {
    lib.userState.get(req.params.id).then(function(state) {
      return res.status(200).json({
        state: state
      });
    }).catch(function(err) {
      res.status(500).json({
        error: {
          code: 500,
          message: 'Server Error',
          details: err.message || 'Error while fetching user state for user' + req.params.id
        }
      });
    });
  }

  function setMyState(req, res) {
    if (!req.body.state) {
      return res.status(400).json({
        error: {
          code: 400,
          message: 'Bad request',
          details: 'You should provide the user state'
        }
      });
    }

    lib.userState.set(req.user._id, req.body.state).then(function() {
      res.status(204).end();
    }).catch(function(err) {
      res.status(500).json({
        error: {
          code: 500,
          message: 'Server Error',
          details: err.message || 'Error while setting user state for user' + req.params.id
        }
      });
    });
  }

  function updateTopic(req, res) {
    var topic = {
      value: req.body.value,
      creator: req.user._id,
      last_set: new Date()
    };
    lib.conversation.updateTopic(req.params.id, topic, function(err, conversation) {
      if (err) {
        return res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details: err.message || 'Error while update the topic for channel' + req.params.id
          }
        });
      }
      res.status(200).json(conversation);
    });
  }

  function updateConversation(req, res) {
    if (!req.body.conversation) {
      return res.status(400).json({
        error: {
          code: 400,
          message: 'Bad request',
          details: 'You should provide the conversation id'
        }
      });
    }

    if (!req.body.modifications) {
      return res.status(400).json({
        error: {
          code: 400,
          message: 'Bad request',
          details: 'You should provide the modifications of the conversation'
        }
      });
    }

    lib.conversation.updateConversation(req.body.conversation, req.body.modifications, function(err, conversation) {
      if (err) {
        return res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details: err.message || 'Error while update the conversation ' + req.body.id
          }
        });
      }

      res.status(200).json(conversation);
    });
  }

  return {
    getMessage: getMessage,
    getMessages: getMessages,
    getChannels: getChannels,
    getConversation: getConversation,
    markAllMessageOfAConversationReaded: markAllMessageOfAConversationReaded,
    findPrivateByMembers: findConversationByTypeAndByMembers.bind(null, CONVERSATION_TYPE.PRIVATE),
    findCommunity: findCommunity,
    findMyPrivateConversations: findMyConversationByType.bind(null, CONVERSATION_TYPE.PRIVATE),
    findMyCommunityConversations: findMyConversationByType.bind(null, CONVERSATION_TYPE.COMMUNITY),
    findMyConversations: findMyConversations,
    getUserState: getUserState,
    setMyState: setMyState,
    joinConversation: joinConversation,
    leaveConversation: leaveConversation,
    deleteConversation: deleteConversation,
    createConversation: createConversation,
    updateTopic: updateTopic,
    updateConversation: updateConversation
  };
};
