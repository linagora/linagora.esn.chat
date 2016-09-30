'use strict';

let express = require('express');
const FRONTEND_PATH = require('../constants').FRONTEND_PATH;

/*eslint no-unused-vars: ["error", {"args": "after-used"}]*/
module.exports = function(dependencies, application) {
  application.use(express.static(FRONTEND_PATH));
  application.set('views', FRONTEND_PATH + '/views');
  application.get('/views/*', function(req, res) {
      res.render(req.params[0].replace(/\.html$/, ''));
    }
  );
};
