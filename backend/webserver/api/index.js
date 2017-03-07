'use strict';

const express = require('express');

module.exports = function(dependencies, lib) {

  const router = express.Router();

  require('./conversation')(dependencies, lib, router);
  require('./message')(dependencies, lib, router);

  return router;
};
