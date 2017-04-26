'use strict';

const Q = require('q');
const CONSTANTS = require('../../lib/constants');

module.exports = function(dependencies, lib) {

  const logger = dependencies('logger');
  const denormalizer = require('../denormalizers/message')(dependencies, lib);
  const resourceLink = dependencies('resourceLink');
  const utils = require('./utils')(dependencies, lib);

  return {
    get,
    getAttachmentsForConversation,
    getForConversation,
    search
  };

  function get(req, res) {
    denormalizer.denormalizeMessage(req.message, req.user).then(denormalizedMessage => res.status(200).json(denormalizedMessage));
  }

  function getAttachmentsForConversation(req, res) {
    lib.message.getAttachmentsForConversation(req.conversation._id, req.query, (err, attachments = []) => {
      if (err) {
        return sendHTTPError(`Error while getting attachments of conversation ${req.conversation._id}`, err, res);
      }

      denormalizer.denormalizeAttachments(attachments)
        .then(denormalized => {
          res.status(200).json(denormalized);
        })
        .catch(err => {
          sendHTTPError(`Error while denormalizing attachments of conversation ${req.conversation._id}`, err, res);
        });
    });
  }

  function getForConversation(req, res) {
    lib.message.getForConversation(req.conversation._id, req.query, (err, results) => {
      if (err) {
        return sendHTTPError(`Error while getting messages for conversation ${req.conversation._id}`, err, res);
      }

      return denormalizer.denormalizeMessages(results, req.user).then(denormalizedMessages => res.status(200).json(denormalizedMessages));
    });
  }

  function getStarredMessages(req, res) {
    const offset = parseInt(req.query.offset || CONSTANTS.DEFAULT_OFFSET, 10);
    const limit = parseInt(req.query.limit || CONSTANTS.DEFAULT_LIMIT, 10);

    resourceLink.list({
      type: 'star',
      source: {
        id: String(req.user._id),
        objectType: 'user'
      },
      target: {
        objectType: CONSTANTS.OBJECT_TYPES.MESSAGE
      },
      offset: offset,
      limit: limit
    })
      .then(result => {
        denormalizer.denormalizeStarredMessages(result)
          .then(denormalized => res.status(200).json(denormalized))
          .catch(error => {
            sendHTTPError('Error while denormalizing starred message', error, res);
          });
      })
      .catch(error => {
        sendHTTPError('Error while fetching resourceLink', error, res);
      });
  }

  function search(req, res) {

    function hydrateMessage(message) {
      return lib.message.getByIdAndPopulate(message._id, ['creator', 'user_mentions', 'channel']);
    }

    function sendError(err) {
      sendHTTPError('Error while searching messages', err, res);
    }

    if (req.query.starred === 'true') {
      getStarredMessages(req, res);
    } else {
      lib.message.searchForUser(req.user, {search: req.query.search}, (err, result) => {
        if (err) {
          return sendError(err);
        }

        res.header('X-ESN-Items-Count', result.total_count || 0);
        Q.all(result.list.map(hydrateMessage))
          .then(messages => denormalizer.denormalizeMessages(messages, req.user))
          .then(denormalizedMessages => res.status(200).json(denormalizedMessages), sendError);
      });
    }
  }

  function sendHTTPError(message, err, res) {
    logger.error(message, err);

    return utils.sendHTTP500Error(message, res);
  }
};
