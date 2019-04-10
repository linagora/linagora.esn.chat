const { SEARCH } = require('../../constants');

module.exports = dependencies => {
  const { reindexRegistry } = dependencies('elasticsearch');
  const { listByCursor } = require('../../conversation')(dependencies);
  const { getConversationOptions } = require('./listener')(dependencies);
  const { denormalize } = require('./denormalize')(dependencies);

  return {
    register
  };

  function register() {
    reindexRegistry.register(SEARCH.CONVERSATIONS.TYPE_NAME, {
      name: SEARCH.CONVERSATIONS.INDEX_NAME,
      buildReindexOptionsFunction: _buildElasticsearchReindexOptions
    });
  }

  function _buildElasticsearchReindexOptions() {
    const options = {
      ...getConversationOptions(),
      denormalize
    };
    const cursor = listByCursor();

    options.name = SEARCH.CONVERSATIONS.INDEX_NAME;
    options.next = () => cursor.next();

    return Promise.resolve(options);
  }
};
