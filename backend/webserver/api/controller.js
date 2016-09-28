'use strict';

let _ = require('lodash');
const CONSTANTS = require('../../lib/constants');
const CONVERSATION_TYPE = CONSTANTS.CONVERSATION_TYPE;

/*eslint no-unused-vars: ["error", {"args": "after-used"}]*/
module.exports = function(dependencies, lib) {

  function getMessages(req, res) {
    lib.conversation.getMessages(req.params.channel, {}, (err, results) => {
      if (err) {
        return res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details: err.message || 'Error while getting messages'
          }
        });
      }

      return res.status(200).json(results);
    });
  }

  function getMessage(req, res) {
    lib.conversation.getMessage(req.params.id, (err, message) => {
      if (err) {
        return res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details: err.message || 'Error while getting message'
          }
        });
      }

      return res.status(200).json(message);
    });
  }

  function getChannels(req, res) {
    lib.conversation.getChannels({}, (err, result) => {
      if (err) {
        return res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details: err.message || 'Error while getting channels'
          }
        });
      }

      res.status(200).json(result);
    });
  }

  function getConversation(req, res) {
    lib.conversation.getConversation(req.params.id, (err, result) => {
      if (err) {
        return res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details: err.message || 'Error while getting channel'
          }
        });
      }

      res.status(200).json(result);
    });
  }

  function deleteConversation(req, res) {
    if (!req.params.id) {
      return res.status(400).json({
        error: {
          code: 400,
          message: 'Bad request',
          details: 'You should provide the conversation id'
        }
      });
    }

    lib.conversation.deleteConversation(req.user._id, req.params.id, (err, numDeleted) => {
      if (err) {
        return res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details: err.message || 'Error while deleting channel'
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
    let members = [];

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

    lib.conversation.findConversation({type: CONSTANTS.PRIVATE, exactMembersMatch: true, name: req.body.name ? req.body.name : null, members: members}, (err, conversations) => {
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
        let conversation = {
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

        lib.conversation.createConversation(conversation, (err, result) => {
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
    lib.conversation.makeAllMessageReadedForAnUser(req.user._id, req.params.id, err => {
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
    lib.conversation.addMemberToConversation(req.params.id, req.user._id, err => {
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
    lib.conversation.removeMemberFromConversation(req.params.id, req.user._id, err => {
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

    let members = _.isArray(req.query.members) ? req.query.members : [req.query.members];

    if (members.indexOf(String(req.user._id)) === -1) {
      members.push(String(req.user._id));
    }

    lib.conversation.findConversation({type: type, ignoreMemberFilterForChannel: true, exactMembersMatch: true, members: members}, (err, userGroups) => {
      if (err) {
        return res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details: err.message || 'Error while finding groups with users' + members.join(', ')
          }
        });
      }

      res.status(200).json(userGroups);
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

    lib.conversation.getCommunityConversationByCommunityId(req.query.id, (err, conversation) => {
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

      res.status(200).json(conversation);
    });
  }

  function findMyConversationByType(type, req, res) {
    lib.conversation.findConversation({type: type, ignoreMemberFilterForChannel: true, members: [String(req.user._id)]}, (err, usersGroups) => {
      if (err) {
        return res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details: err.message || 'Error while finding groups of user ' + req.user._id
          }
        });
      }

      res.status(200).json(usersGroups);
    });
  }

  function findMyConversations(req, res)  {
    lib.conversation.findConversation({type: req.query.type, ignoreMemberFilterForChannel: true, members: [String(req.user._id)]}, (err, usersGroups) => {
      if (err) {
        return res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details: err.message || 'Error while finding groups of user ' + req.user._id
          }
        });
      }

      res.status(200).json(usersGroups);
    });
  }

  function getUserState(req, res) {
    lib.userState.get(req.params.id).then(state => {
      res.status(200).json({state});
    }).catch(err => {
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

    lib.userState.set(req.user._id, req.body.state).then(() => {
      res.status(204).end();
    }).catch(err => {
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
    let topic = {
      value: req.body.value,
      creator: req.user._id,
      last_set: new Date()
    };

    lib.conversation.updateTopic(req.params.id, topic, (err, conversation) => {
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

    lib.conversation.updateConversation(req.body.conversation, req.body.modifications, (err, conversation) => {
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
    getMessage,
    getMessages,
    getChannels,
    getConversation,
    markAllMessageOfAConversationReaded,
    findPrivateByMembers: findConversationByTypeAndByMembers.bind(null, CONVERSATION_TYPE.PRIVATE),
    findCommunity,
    findMyPrivateConversations: findMyConversationByType.bind(null, CONVERSATION_TYPE.PRIVATE),
    findMyCommunityConversations: findMyConversationByType.bind(null, CONVERSATION_TYPE.COMMUNITY),
    findMyConversations,
    getUserState,
    setMyState,
    joinConversation,
    leaveConversation,
    deleteConversation,
    createConversation,
    updateTopic,
    updateConversation
  };
};
