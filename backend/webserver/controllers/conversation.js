'use strict';

/*eslint no-unused-vars: ["error", {"args": "after-used"}]*/

let _ = require('lodash');
const CONSTANTS = require('../../lib/constants');
const CONVERSATION_TYPE = CONSTANTS.CONVERSATION_TYPE;

module.exports = function(dependencies, lib) {

  const logger = dependencies('logger');

  return {
    getById,
    markAllMessageOfAConversationReaded,
    findMyConversationByType,
    findConversationByTypeAndByMembers,
    //findPrivateByMembers: findConversationByTypeAndByMembers.bind(null, CONVERSATION_TYPE.PRIVATE),
    findMyPrivateConversations: findMyConversationByType.bind(null, CONVERSATION_TYPE.PRIVATE),
    findMyConversations,
    joinConversation,
    leaveConversation,
    list,
    remove,
    create,
    updateTopic,
    update
  };

  function getById(req, res) {
    lib.conversation.getById(req.params.id, (err, result) => {
      if (err) {
        logger.error('Error while getting conversation %s', req.params.id, err);

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

  function remove(req, res) {
    if (!req.params.id) {
      return res.status(400).json({
        error: {
          code: 400,
          message: 'Bad request',
          details: 'You should provide the conversation id'
        }
      });
    }

    lib.conversation.remove(req.user._id, req.params.id, (err, numDeleted) => {
      if (err) {
        logger.error('Error while deleting conversation %s', req.params.id, err);

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

  function create(req, res) {
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

    lib.conversation.find({type: CONSTANTS.PRIVATE, exactMembersMatch: true, name: req.body.name ? req.body.name : null, members: members}, (err, conversations) => {
      if (err) {
        logger.error('Error while searching conversation', err);

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

        lib.conversation.create(conversation, (err, result) => {
          logger.error('Error while creating conversation', err);

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
    lib.message.markAllAsReadById(req.user._id, req.params.id, err => {
      if (err) {
        logger.error('Error while marking messages as read', err);

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
    lib.conversation.addMember(req.params.id, req.user._id, err => {
      if (err) {
        logger.error('Error while joining conversation %s', req.params.id, err);

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
    lib.conversation.removeMember(req.params.id, req.user._id, err => {
      logger.error('Error while leaving conversation %s', req.params.id, err);

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

    lib.conversation.find({type: type, ignoreMemberFilterForChannel: true, exactMembersMatch: true, members: members}, (err, userGroups) => {
      if (err) {
        logger.error('Error while searching conversations', err);

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

  function findMyConversationByType(type, req, res) {
    lib.conversation.find({type: type, ignoreMemberFilterForChannel: true, members: [String(req.user._id)]}, (err, usersGroups) => {
      if (err) {
        logger.error('Error while searching conversation by type', err);

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
    lib.conversation.find({type: req.query.type, ignoreMemberFilterForChannel: true, members: [String(req.user._id)]}, (err, usersGroups) => {
      if (err) {
        logger.error('Error while getting user %s conversations', req.user._id, err);

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

  function updateTopic(req, res) {
    let topic = {
      value: req.body.value,
      creator: req.user._id,
      last_set: new Date()
    };

    lib.conversation.updateTopic(req.params.id, topic, (err, conversation) => {
      if (err) {
        logger.error('Error while updating topic for %s conversation', req.params.id, err);

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

  function update(req, res) {
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

    lib.conversation.update(req.body.conversation, req.body.modifications, (err, conversation) => {
      if (err) {
        logger.error('Error while updating conversation', err);

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

  function list(req, res) {
    if (req.query.type === CONVERSATION_TYPE.PRIVATE) {
      return findConversationByTypeAndByMembers(CONVERSATION_TYPE.PRIVATE, req, res);
    }

    res.status(400).json({
      error: {
        code: 400,
        message: 'Bad request',
        details: 'Can not get conversations with current parameters'
      }
    });
  }

};
