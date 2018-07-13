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
    markUserAsReadAllMessages,
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
    const requestedUser = req.user;

    return _createConversation(requestedUser, req.body)
      .then(createdConversation => {
        if (req.body.type === CONSTANTS.CONVERSATION_TYPE.DIRECT_MESSAGE) {
          return lib.userSubscribedPrivateConversation.get(requestedUser._id)
            .then(subscribedPrivateConversation => {
              const createdConversationId = String(createdConversation._id);
              const subscribedConversationIds = subscribedPrivateConversation && subscribedPrivateConversation.conversations ? subscribedPrivateConversation.conversations : [];

              if (subscribedConversationIds.indexOf(createdConversationId) !== -1) {
                return createdConversation;
              }

              subscribedConversationIds.push(createdConversationId);

              return lib.userSubscribedPrivateConversation.store(requestedUser._id, subscribedConversationIds)
                .then(() => createdConversation);
            });
        }

        return createdConversation;
      })
      .then(createdConversation => utils.sendConversationResult(createdConversation, req.user, res, 201))
      .catch(err => {
        const errorMessage = 'Errror while creating conversation';

        logger.error(errorMessage, err);

        return res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details: errorMessage
          }
        });
      });
  }

  function _createConversation(requestedUser, data) {
    const memberIds = new Set(data.members || []).add(String(requestedUser._id));
    const members = Array.from(memberIds).map(member => ({
      member: { id: member, objectType: OBJECT_TYPES.USER }
    }));
    const findQuery = {
      type: data.type,
      mode: data.mode,
      exactMembersMatch: true,
      name: data.name ? data.name : null,
      members: members,
      populations: { lastMessageCreator: true, lastMessageMentionedUsers: true }
    };

    return Q.ninvoke(lib.conversation, 'find', findQuery)
      .then(conversations => {
        if (conversations && conversations.length > 0) {
          return conversations[0];
        }

        const conversationToCreate = {
          name: data.name,
          type: data.type,
          mode: data.mode,
          creator: requestedUser._id,
          topic: {
            value: data.topic,
            creator: requestedUser._id
          },
          avatar: data.avatar,
          members: members,
          purpose: {
            value: data.purpose,
            creator: requestedUser._id
          }
        };

        if (data.domain) {
          conversationToCreate.domain_ids = [data.domain];
        }

        return Q.ninvoke(lib.conversation, 'create', conversationToCreate);
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
    const options = {
      mode: CONSTANTS.CONVERSATION_MODE.CHANNEL,
      ignoreMemberFilterForChannel: false,
      members: [{member: currentUserAsMember(req)}],
      populations: { lastMessageCreator: true, lastMessageMentionedUsers: true },
      sort: { [CONSTANTS.SORT_FIELDS.CONVERSATION.lastMessageDate]: CONSTANTS.SORT_TYPE.ASC }
    };

    if (req.query.unread === 'true') {
      options.unread = true;
      // no need populate and sort when search unread conversations
      delete options.populations;
      delete options.sort;
    }

    getConversations(options, req, res);
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

  function markUserAsReadAllMessages(req, res) {
    return Q.denodeify(lib.conversation.markUserAsReadAllMessages)(req.user._id, req.conversation)
      .then(() => res.status(204).end())
      .catch(err => {
        logger.error('Error while marking user as read all messages', err);

        return res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details: 'Error while marking user as read all messages'
          }
        });
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
