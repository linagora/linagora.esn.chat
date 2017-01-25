'use strict';

const path = require('path');
const ESConfiguration = require('esn-elasticsearch-configuration');
const INDEXES = ['chat.messages', 'chat.conversations'];

function createCommand(command) {
  command
    .description('Configure ElasticSearch for the chat module')
    .option('-h, --host <host>', 'elasticsearch host to connect to')
    .option('-p, --port <port>', 'elasticsearch port to connect to')
    .option('-i, --index <index>', 'index to create')
    .action(cmd => {
      exec(cmd.host, cmd.port, cmd.index).then(() => {
        console.log('ElasticSearch has been configured');
      }, err => {
        console.log('Error while configuring ElasticSearch', err);
      }).finally(() => {
        console.log('Done');
        process.exit();
      });
    });
}

function exec(host = 'localhost', port = 9200, index) {
  const p = path.normalize(__dirname + '/../../config/elasticsearch/');
  const conf = new ESConfiguration({path: p, host, port});

  if (index) {
    return conf.createIndex(index);
  }

  return Promise.all(INDEXES.map(index => conf.createIndex(index)));
}

module.exports.createCommand = createCommand;
module.exports.exec = exec;
