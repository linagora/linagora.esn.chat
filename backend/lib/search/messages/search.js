'use strict';

const CONSTANTS = require('../../constants');
const SEARCH = CONSTANTS.SEARCH;

module.exports = function(dependencies) {

  const elasticsearch = dependencies('elasticsearch');
  const logger = dependencies('logger');

  return {
    searchInConversations
  };

  function searchInConversations(query = {}, conversationIds = [], callback) {

    const offset = +query.offset || 0;
    const limit = +query.limit || CONSTANTS.DEFAULT_LIMIT;

    var elasticsearchQuery = {
      query: {
        bool: {
          filter: {
            terms: {
              channel: conversationIds
            }
          },
          must: {
            match: {
              text: query.search
            }
          }
        }
      }
    };

    logger.debug(`Searching chat messages with search: ${query.search}, limit: ${limit}, offset: ${offset}`);

    elasticsearch.searchDocuments({
      index: SEARCH.MESSAGES.INDEX_NAME,
      type: SEARCH.MESSAGES.TYPE_NAME,
      from: offset,
      size: limit,
      body: elasticsearchQuery
    }, (err, result) => {
      if (err) {
        return callback(err);
      }

      return callback(null, {
        total_count: result.hits.total,
        list: result.hits.hits
      });
    });
  }
};
