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

  if (initialized) {
    return logger.warn('The chat websocket service is already initialized');
  }

  chatNamespace = io.of(NAMESPACE);

  const transport = new Transport(chatNamespace, {dependencies});
  const messenger = new Messenger(transport, {dependencies});

  adapter.bindEvents(messenger);

  initialized = true;

  return {
    messenger,
    transport
  };
}
