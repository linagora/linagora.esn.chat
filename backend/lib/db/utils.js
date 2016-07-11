'use strict';

module.exports.cleanUser = function(user) {
  delete user.password;
  delete user.accounts;
};
