'use strict';

let express = require('express');

module.exports = function(dependencies, lib) {

  let router = express.Router();

  require('./channel')(dependencies, lib, router);
  require('./community')(dependencies, lib, router);
  require('./conversation')(dependencies, lib, router);
  require('./message')(dependencies, lib, router);
  require('./user-state')(dependencies, lib, router);

  return router;
};
