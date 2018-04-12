'use strict';

const CONSTANTS = require('../../lib/constants');
const OBJECT_TYPES = CONSTANTS.OBJECT_TYPES;
const Q = require('q');

module.exports = function(dependencies, lib) {

  const logger = dependencies('logger');
  const denormalizeUser = dependencies('denormalizeUser');
  const userModule = dependencies('user');
  const denormalizer = require('../denormalizers/message')(dependencies, lib);
  const utils = require('./utils')(dependencies, lib);

  return {
    archive,
    addMember,
    create,
    get,
    getById,
    getUserConversations,
    getUserPrivateConversations,
    getSummaryOfConversation,
    list,
    markAllMessageOfAConversationReaded,
    searchForPublicConversations,
    updateTopic,
    update
  };

  function archive(req, res) {
    lib.conversation.archive(req.conversation, req.user).then(archived => {
      if (archived) {
        return utils.sendConversationResult({archived: archived}, req.user, res);
      }

      return res.status(500).json({
        error: {
          code: 500,
          message: 'Server Error',
          details: 'Error cannot archive conversation'
        }
      });
    }).catch(err => {
      logger.error('Error while archiving conversation', err);

      return res.status(500).json({
        error: {
          code: 500,
          message: 'Server Error',
          details: 'Error while archiving conversation'
        }
      });
    });
  }

  function addMember(req, res) {
    function addMemberResponse(req, res) {
      return function(err, result) {
        if (err) {
          logger.error('Error while adding member', err);

          return res.status(500).json({
            error: {
              code: 500,
              message: 'Server Error',
              details: 'Error while adding member'
            }
          });
        }

        utils.sendConversationResult(result, req.user, res);
      };
    }

    lib.members.addMember(req.conversation, req.user, req.params.member_id, addMemberResponse(req, res));
  }

  function currentUserAsMember(req) {
    return {objectType: OBJECT_TYPES.USER, id: String(req.user._id)};
  }

  function create(req, res) {
    const memberIds = new Set(req.body.members || []).add(String(req.user._id));
    const members = Array.from(memberIds).map(member => ({member: {id: member, objectType: OBJECT_TYPES.USER}}));

    lib.conversation.find({
      type: req.body.type,
      mode: req.body.mode,
      exactMembersMatch: true,
      name: req.body.name ? req.body.name : null,
      members: members
    }, (err, conversations) => {
      if (err) {
        logger.error('Error while searching conversation', err);

        return res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details: 'Error while finding conversations with users' + members.join(', ')
          }
        });
      }

      if (conversations && conversations.length > 0) {
        return utils.sendConversationResult(conversations[0], req.user, res, 201);
      }

      const conversation = {
        name: req.body.name,
        type: req.body.type,
        mode: req.body.mode,
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

      if (req.body.domain) {
        conversation.domain_ids = [req.body.domain];
      }

      lib.conversation.create(conversation, (err, result) => {
        if (err) {
          logger.error('Errror while creating conversation', err);

          return res.status(500).json({
            error: {
              code: 500,
              message: 'Server Error',
              details: 'Error while creating conversation'
            }
          });
        }

        utils.sendConversationResult(result, req.user, res, 201);
      });
    });
  }

  function get(req, res) {
    utils.sendConversationResult(req.conversation, req.user, res);
  }

  function getById(req, res) {
    lib.conversation.getById(req.params.id, sendResponse(req, res));
  }

  function getConversations(options, req, res) {
    lib.conversation.find(options, sendResponse(req, res));
  }

  function getUserConversations(req, res) {
    getConversations({
      mode: CONSTANTS.CONVERSATION_MODE.CHANNEL,
      ignoreMemberFilterForChannel: false,
      members: [{member: currentUserAsMember(req)}]
    }, req, res);
  }

  function getUserPrivateConversations(req, res) {
    getConversations({
      mode: CONSTANTS.CONVERSATION_MODE.CHANNEL,
      type: CONSTANTS.CONVERSATION_TYPE.CONFIDENTIAL,
      members: [{member: currentUserAsMember(req)}]
    }, req, res);
  }

  function getSummaryOfConversation(req, res) {
    const memberCount = {};

    getConversationById(req.params.id).then(conversation => {
      if (!conversation) {
        logger.error('Conversation not found');
        const error = new Error('Not Found');

        error.code = 404;
        error.details = 'Conversation not found';
        throw error;
      }

      return Q.all([
        conversation,
        getCreator(conversation),
        getNewestMembers(conversation, memberCount),
        getNewestAttachments(conversation)
      ]);
    })
    .spread((conversation, creator, members, attachments) =>
    Q.all(members).then(members =>

        res.status(200).json({
          creator: creator && creator.firstname + ' ' + creator.lastname,
          creationDate: conversation.timestamps.creation,
          name: conversation.name,
          topic: conversation.topic.value,
          purpose: conversation.purpose.value,
          members: members,
          memberCount: memberCount.number,
          attachments: attachments
        })
      )
    )
    .catch(err => {
      logger.error('Error while getting conversations', err);

      return res.status(err.code).json({
        error: {
          code: err.code || 500,
          message: err.message || 'Server Error',
          details: err.details || 'Error while getting conversations'
        }
      });
    });

    function getNewestAttachments(conversation) {
      return getAttachmentsForConversation(conversation._id, {offset: CONSTANTS.DEFAULT_OFFSET, limit: CONSTANTS.DEFAULT_LIMIT, sort: CONSTANTS.SORT_TYPE.DESC}).then(attachments =>
        denormalizer.denormalizeAttachments(attachments)
      );
    }

    function getNewestMembers(conversation, memberCount) {

      return lib.members.getNewestMembers(conversation._id, OBJECT_TYPES.CONVERSATION, {offset: CONSTANTS.DEFAULT_OFFSET, limit: CONSTANTS.DEFAULT_LIMIT})
      .then(members => {
        memberCount.number = members.total_count;
        members = members.reverse();

        return members.map(newestMember =>
          getUser(newestMember.member._id).then(denormalizeUser.denormalize)
        );
      });
    }

    function getCreator(conversation) {
        return conversation.creator && getUser(conversation.creator).then(denormalizeUser.denormalize);
    }

    function getConversationById(conversationId) {
      return Q.denodeify(lib.conversation.getById)(conversationId);
    }

    function getUser(userId) {
      return Q.denodeify(userModule.get)(userId);
    }

    function getAttachmentsForConversation(conversationId, query) {
      return Q.denodeify(lib.message.getAttachmentsForConversation)(conversationId, query);
    }
  }

  function list(req, res) {
    if (req.query.search) {
      return searchForPublicConversations(req.query.search, req, res);
    }

    const queryOverrides = {
      mode: CONSTANTS.CONVERSATION_MODE.CHANNEL,
      type: CONSTANTS.CONVERSATION_TYPE.OPEN,
      domain_ids: req.user.preferredDomainId
    };

    lib.conversation.list(Object.assign(req.query || {}, queryOverrides), (err, result) => {
      if (err) {
        logger.error('Error while getting conversations', err);

        return res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details: err.message || 'Error while getting conversations'
          }
        });
      }
      res.header('X-ESN-Items-Count', result.total_count || 0);
      utils.sendConversationResult(result.list, req.user, res);
    });
  }

  function markAllMessageOfAConversationReaded(req, res) {
    lib.message.markAllAsReadById(req.user._id, req.conversation._id, err => {
      if (err) {
        logger.error('Error while marking messages as read', err);

        return res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details: 'Error while marking all messages as read'
          }
        });
      }

      res.status(204).end();
    });
  }

  function sendResponse(req, res) {
    return function(err, result) {
      if (err) {
        logger.error('Error while getting conversations', err);

        return res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details: 'Error while getting conversations'
          }
        });
      }

      utils.sendConversationResult(result, req.user, res);
    };
  }

  function update(req, res) {
    if (!req.body) {
      return res.status(400).json({
        error: {
          code: 400,
          message: 'Bad request',
          details: 'You should provide the modifications of the conversation'
        }
      });
    }

    lib.conversation.update(req.conversation._id, req.body, (err, conversation) => {
      if (err) {
        logger.error('Error while updating conversation', err);

        return res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details: `Error while updating the conversation ${req.conversation._id}`
          }
        });
      }

      utils.sendConversationResult(conversation, req.user, res);
    });
  }

  function updateTopic(req, res) {
    const topic = {
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
            details: `Error while update the topic for conversation ${req.params.id}`
          }
        });
      }

      utils.sendConversationResult(conversation, req.user, res);
    });
  }

  function searchForPublicConversations(phrase, req, res) {

    lib.conversation.getAllForUser(req.user)
      .then(searchConversations)
      .then(getConversationsFromSearchResult)
      .then(sendResult)
      .catch(onError);

    function getConversation(conversation) {
      return Q.denodeify(lib.conversation.getById)(conversation._id);
    }

    function getConversationsFromSearchResult(searchResult) {
      return Q.all(searchResult.list.map(getConversation)).then(conversations => ({list: conversations, total_count: searchResult.total_count}));
    }

    function onError(err) {
      logger.error('Error while searching conversations', err);

      return res.status(500).json({
        error: {
          code: 500,
          message: 'Server Error',
          details: err.message || 'Error while searching conversations'
        }
      });
    }

    function searchConversations(userConversations) {
      return Q.denodeify(lib.search.conversations.search.searchConversations)({search: phrase, limit: req.query.limit, offset: req.query.offset}, userConversations.map(conversation => String(conversation._id)));
    }

    function sendResult(result) {
      res.header('X-ESN-Items-Count', result.total_count || 0);
      utils.sendConversationResult(result.list, req.user, res);
    }
  }
};
