'use strict';

let _ = require('lodash');
const CONSTANTS = require('../../lib/constants');
const CONVERSATION_TYPE = CONSTANTS.CONVERSATION_TYPE;

module.exports = function(dependencies, lib) {

  let conversationController = require('./conversation')(dependencies, lib);

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
      return conversationController.findConversationByTypeAndByMembers(CONVERSATION_TYPE.COMMUNITY, req, res);
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

  return {
    findCommunity,
    findMyCommunityConversations: conversationController.findMyConversationByType.bind(null, CONVERSATION_TYPE.COMMUNITY),
  };
};
