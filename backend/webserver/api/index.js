'use strict';

const express = require('express');

module.exports = function(dependencies, lib) {

  const router = express.Router();

  require('./channel')(dependencies, lib, router);
  require('./collaboration')(dependencies, lib, router);
  require('./conversation')(dependencies, lib, router);
  require('./message')(dependencies, lib, router);
  require('./user-state')(dependencies, lib, router);

  return router;
};
