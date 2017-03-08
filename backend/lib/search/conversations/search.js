'use strict';

const CONSTANTS = require('../../constants');
const SEARCH = CONSTANTS.SEARCH;

module.exports = function(dependencies) {

  const elasticsearch = dependencies('elasticsearch');
  const logger = dependencies('logger');

  return {
    searchConversations
  };

  function searchConversations(query = {}, conversationIds = [], callback) {

    const offset = +query.offset || 0;
    const limit = +query.limit || CONSTANTS.DEFAULT_LIMIT;

    const elasticsearchQuery = {
      query: {
        multi_match: {
          query: query.search,
          fields: [
            'name',
            'purpose.value',
            'topic.value'
          ]
        }
      },
      filter: {
        or: [
          {
            and: [
              {term: {type: CONSTANTS.CONVERSATION_TYPE.CONFIDENTIAL}},
              {or: conversationIds.map(id => ({term: {id: id}}))}
            ]
          },
          {term: {type: CONSTANTS.CONVERSATION_TYPE.OPEN}}
        ]
      }
    };

    logger.debug(`Searching chat conversation with search: ${query.search}, limit: ${limit}, offset: ${offset}`);

    elasticsearch.searchDocuments({
      index: SEARCH.CONVERSATIONS.INDEX_NAME,
      type: SEARCH.CONVERSATIONS.TYPE_NAME,
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
