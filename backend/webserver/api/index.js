'use strict';

const express = require('express');

module.exports = function(dependencies, lib) {

  const router = express.Router();
  const resourceLinkMiddleware = dependencies('resourceLinkMW');
  const messageMiddleware = require('../middlewares/message')(dependencies, lib);
  const moduleName = 'linagora.esn.chat';

  require('./conversation')(dependencies, lib, router, moduleName);
  require('./message')(dependencies, lib, router, moduleName);
  require('./user-subscribed-private-conversation')(dependencies, lib, router, moduleName);

  resourceLinkMiddleware.addCanCreateMiddleware('star', messageMiddleware.canStar);
  resourceLinkMiddleware.addCanCreateMiddleware('unstar', messageMiddleware.canUnstar);

  return router;
};
