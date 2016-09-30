'use strict';

module.exports = function(dependencies, application) {
  let i18n = require('../../lib/i18n')(dependencies);

  application.use(i18n.init);
};
