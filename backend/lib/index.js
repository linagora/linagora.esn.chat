'use strict';

const Q = require('q');
const constants = require('./constants');

module.exports = function(dependencies) {

  const models = {
    conversation: require('./db/conversation')(dependencies),
    message: require('./db/message')(dependencies)
  };

  const utils = require('./utils')(dependencies);
  const search = require('./search')(dependencies);
  const conversation = require('./conversation')(dependencies);
  const message = require('./message')(dependencies, {conversation, search});
  const members = require('./members')(dependencies);
  const moderate = require('./moderate')(dependencies);
  const listener = require('./listener')(dependencies, {conversation, message});

  return {
    constants,
    conversation,
    listener,
    members,
    message,
    moderate,
    models,
    search,
    start,
    utils
  };

  function start(callback) {
    listener.start();
    moderate.start();
    search.init();
    conversation.registerUserConversationFinder(Q.denodeify(conversation.listForUser));
    callback();
  }
};
