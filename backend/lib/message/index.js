'use strict';

module.exports = function(dependencies) {

  return {
    listener: require('./listener')(dependencies)
  };

};
