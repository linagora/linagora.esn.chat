'use strict';

const CONSTANTS = require('../constants');
const _ = require('lodash');

module.exports = function(dependencies) {

  const mongoose = dependencies('db').mongo.mongoose;
  const ObjectId = mongoose.Schema.ObjectId;
  const baseCollaboration = dependencies('db').mongo.models['base-collaboration'];
  const collaborationModule = dependencies('collaboration');
  const Conversation = require('./conversation-base')(dependencies);
  const ArchivedConversationDefinition = _.cloneDeep(Conversation);

   ArchivedConversationDefinition.archived = {
    by: ObjectId,
    timestamp: {type: Date, default: Date.now}
  };

  const ArchivedConversationSchema = baseCollaboration(ArchivedConversationDefinition, CONSTANTS.OBJECT_TYPES.ARCHIVED_CONVERSATION);

  return collaborationModule.registerCollaborationModel(CONSTANTS.OBJECT_TYPES.ARCHIVED_CONVERSATION, 'ChatArchivedConversation', ArchivedConversationSchema);
};
