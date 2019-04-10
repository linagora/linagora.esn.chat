const { SEARCH } = require('../../constants');

module.exports = dependencies => {
  const { reindexRegistry } = dependencies('elasticsearch');
  const { listByCursor } = require('../../message')(dependencies);
  const { getMessageOptions } = require('./listener')(dependencies);
  const { denormalize } = require('./denormalize')(dependencies);

  return {
    register
  };

  function register() {
    reindexRegistry.register(SEARCH.MESSAGES.TYPE_NAME, {
      name: SEARCH.MESSAGES.INDEX_NAME,
      buildReindexOptionsFunction: _buildElasticsearchReindexOptions
    });
  }

  function _buildElasticsearchReindexOptions() {
    const options = {
      ...getMessageOptions(),
      denormalize
    };
    const cursor = listByCursor();

    options.name = SEARCH.MESSAGES.INDEX_NAME;
    options.next = () => cursor.next();

    return Promise.resolve(options);
  }
};
