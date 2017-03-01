'use strict';

const Adapter = require('./adapter');
const Bot = require('./engine/bot');

module.exports = (dependencies, lib) => {
  return {
    start
  };

  function start(websocket) {
    const adapter = new Adapter(dependencies, lib, websocket.messenger);
    const chatBot = new Bot(adapter);

    require('./plugins/notmember-mention')(dependencies, lib)(chatBot);

    chatBot.start();
  }
};
