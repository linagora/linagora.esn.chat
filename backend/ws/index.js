'use strict';

const CONSTANTS = require('../lib/constants');
const NAMESPACE = CONSTANTS.WEBSOCKET.NAMESPACE;
const Messenger = require('./messenger');
const Transport = require('./transport');
let initialized = false;
let chatNamespace;

module.exports = {
  init
};

function init(dependencies, lib) {
  const logger = dependencies('logger');
  const io = dependencies('wsserver').io;
  const adapter = require('./adapter')(dependencies, lib);
  const options = {
    ioHelper: dependencies('wsserver').ioHelper,
    logger: dependencies('logger'),
    userModule: dependencies('user'),
    conversation: lib.conversation,
    membersLib: lib.members
  };

  if (initialized) {
    return logger.warn('The chat websocket service is already initialized');
  }

  chatNamespace = io.of(NAMESPACE);

  const transport = new Transport(chatNamespace, options);
  const messenger = new Messenger(transport, options);

  adapter.bindEvents(messenger);

  initialized = true;

  return {
    messenger,
    transport
  };
}
