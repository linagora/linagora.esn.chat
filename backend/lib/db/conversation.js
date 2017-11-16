'use strict';

const CONSTANTS = require('../constants');
const _ = require('lodash');

module.exports = function(dependencies) {

  const baseCollaboration = dependencies('db').mongo.models['base-collaboration'];
  const collaborationModule = dependencies('collaboration');
  const Conversation = require('./conversation-base')(dependencies);
  const ConversationDefinition = _.cloneDeep(Conversation);

  const ConversationSchema = baseCollaboration(ConversationDefinition, CONSTANTS.OBJECT_TYPES.CONVERSATION);

  return collaborationModule.registerCollaborationModel(CONSTANTS.OBJECT_TYPES.CONVERSATION, 'ChatConversation', ConversationSchema);
};
