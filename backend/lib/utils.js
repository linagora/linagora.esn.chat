'use strict';

module.exports = function(dependencies) {

  const mongoose = dependencies('db').mongo.mongoose;
  const ObjectId = mongoose.Types.ObjectId;

  return {
    ensureObjectId
  };

  function ensureObjectId(id) {
    return id.constructor === ObjectId ? id : new ObjectId(id);
  }

};
