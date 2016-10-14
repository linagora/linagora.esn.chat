'use strict';

const Q = require('q');

module.exports = function(dependencies) {

  let providers = {
    'collaboration': require('./collaboration')(dependencies).getMembers
  };

  return {
    addProvider,
    getMembers,
  };

  function addProvider(type, provider) {
    providers[type] = provider;
  }

  function defaultProvider(conversation) {
    return Q(conversation.members || []);
  }

  function getMembers(conversation) {
    return getProvider(conversation.type)(conversation);
  }

  function getProvider(type) {
    return providers[type] ? providers[type] : defaultProvider;
  }
};
