'use strict';

const path = require('path');
const ESConfiguration = require('esn-elasticsearch-configuration');
const INDEX_TYPES = ['chat.messages', 'chat.conversations'];

function createCommand(command) {
  command
    .description('Configure ElasticSearch for the chat module')
    .option('-h, --host <host>', 'elasticsearch host to connect to')
    .option('-p, --port <port>', 'elasticsearch port to connect to')
    .option('-t, --type <type>', 'type of index')
    .option('-i, --index <index>', 'index to create')
    .action(cmd => {
      exec(cmd.host, cmd.port, cmd.type, cmd.index).then(() => {
        console.log('ElasticSearch has been configured');
      }, err => {
        console.log('Error while configuring ElasticSearch', err);
      }).finally(() => {
        console.log('Done');
        process.exit();
      });
    });
}

function exec(host = 'localhost', port = 9200, type, index) {
  const conf = new ESConfiguration({host: host, port: port});

  if (type) {
    index = index || _getDefaultIndex(type);

    return conf.setup(index, type);
  }

  return Promise.all(INDEX_TYPES.map(type => conf.setup(_getDefaultIndex(type), type)));
}

function _getDefaultIndex(type) {
  return `${type}.idx`;
}

module.exports.createCommand = createCommand;
module.exports.exec = exec;
