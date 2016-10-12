'use strict';

const _ = require('lodash');
const CONSTANTS = require('../../lib/constants');
const CONVERSATION_TYPE = CONSTANTS.CONVERSATION_TYPE;

module.exports = function(dependencies, lib) {

  const logger = dependencies('logger');
  const conversationController = require('./conversation')(dependencies, lib);
  const utils = require('./utils')(dependencies, lib);

  return {
    findCollaboration,
    findMyCollaborationConversations
  };

  function findCollaboration(req, res) {
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
      return conversationController.findConversationByTypeAndByMembers(CONVERSATION_TYPE.COLLABORATION, req, res);
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

    lib.collaboration.getConversationByCollaboration({id: req.query.id, objectType: req.query.objectType}, (err, conversation) => {
      if (err) {
        logger.error('Error while getting collaboration %s conversation', req.query.id, err);

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
            details: 'Collaboration conversation not found'
          }
        });
      }

      if (!_.find(conversation.members, {_id: req.user._id})) {
        return res.status(404).json({
          error: {
            code: 404,
            message: 'Collaboration conversation not found'
          }
        });
      }

      res.status(200).json(conversation);
    });
  }

  function findMyCollaborationConversations(req, res) {
    lib.collaboration.getForUser(req.user, (err, conversations) => {
      if (err) {
        const msg = 'Error while getting conversations for collaborations';

        logger.error(msg, err);

        return res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details: msg
          }
        });
      }

      utils.sendConversationsResult(conversations, res);
    });
  }
};
