'use strict';

const express = require('express');

module.exports = function(dependencies, lib) {

  const router = express.Router();
  const resourceLinkMiddleware = dependencies('resourceLinkMW');
  const messageMiddleware = require('../middlewares/message')(dependencies, lib);

  require('./conversation')(dependencies, lib, router);
  require('./message')(dependencies, lib, router);
  require('./user-subscribed-private-conversation')(dependencies, lib, router);

  resourceLinkMiddleware.addCanCreateMiddleware('star', messageMiddleware.canStar);
  resourceLinkMiddleware.addCanCreateMiddleware('unstar', messageMiddleware.canUnstar);

  return router;
};
