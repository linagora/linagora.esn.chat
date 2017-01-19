'use strict';

const util = require('util');
const fs = require('fs-extra');
const path = require('path');
const async = require('async');
const Q = require('q');
const MongoClient = require('mongodb').MongoClient;
const Server = require('mongodb').Server;
const EsnConfig = require('esn-elasticsearch-configuration');

function _args(grunt) {
  const opts = ['test', 'chunk', 'ci', 'reporter'];
  const args = {};

  opts.forEach(function(optName) {
    const opt = grunt.option(optName);

    if (opt) {
      args[optName] = '' + opt;
    }
  });

  return args;
}

function _taskSuccessIfMatch(grunt, regex, info) {
  let taskIsDone = false;

  return function(chunk, done) {
    if (taskIsDone) { return; }

    if (regex) {
      done = done || grunt.task.current.async();
      if (regex.test('' + chunk)) {
        taskIsDone = true;
        grunt.log.oklns(info);
        done(true);
      }
    }
  };
}

function GruntfileUtils(grunt, servers) {
  this.grunt = grunt;
  this.servers = servers;
  this.args = _args(grunt);
}

GruntfileUtils.prototype.command = function command() {
  const servers = this.servers;
  const commandObject = {};

  commandObject.redis = util.format('%s --port %s %s %s',
      servers.redis.cmd,
      (servers.redis.port ? servers.redis.port : '23457'),
      (servers.redis.pwd ? '--requirepass' + servers.redis.pwd : ''),
      (servers.redis.conf_file ? servers.redis.conf_file : ''));

  commandObject.mongo = function(repl) {
    const replset = repl ?
      util.format('--replSet \'%s\' --smallfiles --oplogSize 128', servers.mongodb.replicat_set_name) :
      '--nojournal';

    return util.format('%s --dbpath %s --port %s %s',
      servers.mongodb.cmd,
      servers.mongodb.dbpath,
      (servers.mongodb.port ? servers.mongodb.port : '23456'),
      replset);
  };

  commandObject.elasticsearch = servers.elasticsearch.cmd +
  ' -Des.http.port=' + servers.elasticsearch.port +
  ' -Des.transport.tcp.port=' + servers.elasticsearch.communication_port +
  ' -Des.cluster.name=' + servers.elasticsearch.cluster_name +
  ' -Des.path.data=' + servers.elasticsearch.data_path +
  ' -Des.path.work=' + servers.elasticsearch.work_path +
  ' -Des.path.logs=' + servers.elasticsearch.logs_path +
  ' -Des.discovery.zen.ping.multicast.enabled=false';

  return commandObject;
};

GruntfileUtils.prototype.shell = function shell() {
  const grunt = this.grunt;

  return {
    newShell: function(command, regex, info) {
      return {
        command: command,
        options: {
          async: false,
          stdout: _taskSuccessIfMatch(grunt, regex, info),
          stderr: grunt.log.error,
          canKill: true
        }
      };
    }
  };
};

GruntfileUtils.prototype.runGrunt = function runGrunt() {
  const grunt = this.grunt;
  const args = this.args;

  function _process(res) {
    if (res.fail) {
      grunt.config.set('esn.tests.success', false);
      grunt.log.writeln('failed');
    } else {
      grunt.config.set('esn.tests.success', true);
      grunt.log.writeln('succeeded');
    }
  }

  return {
    newProcess: function(task) {
      return {
        options: {
          log: true,
          stdout: grunt.log.write,
          stderr: grunt.log.error,
          args: args,
          process: _process,
          task: task
        },
        src: ['Gruntfile-tests.js']
      };
    }
  };
};

GruntfileUtils.prototype.setupEnvironment = function setupEnvironment() {
  const servers = this.servers;

  return function() {
    try {
      fs.mkdirsSync(servers.mongodb.dbpath);
      fs.mkdirsSync(servers.tmp);
    } catch (err) {
      throw err;
    }
  };
};

GruntfileUtils.prototype.cleanEnvironment = function cleanEnvironment() {
  const grunt = this.grunt;
  const servers = this.servers;

  return function() {
    function _removeAllFilesInDirectory(directory) {
      let files;

      try {
        files = fs.readdirSync(directory);
      } catch (e) {
        return;
      }
      if (files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const filePath = directory + '/' + files[i];

          if (fs.statSync(filePath).isFile()) {
            fs.unlinkSync(filePath);
          } else {
            _removeAllFilesInDirectory(filePath);
          }
        }
      }
      try {
        fs.rmdirSync(directory);
      } catch (e) {
        console.error(e);
      }
    }

    const testsFailed = !grunt.config.get('esn.tests.success');
    const applog = path.join(servers.tmp, 'application.log');

    if (testsFailed && fs.existsSync(applog)) {
      fs.copySync(applog, 'application.log');
    }
    _removeAllFilesInDirectory(servers.tmp);

    if (testsFailed) {
      grunt.log.writeln('Tests failure');
      grunt.fail.fatal('error', 3);
    }

    const done = this.async();

    done(true);
  };
};

GruntfileUtils.prototype.setupMongoReplSet = function setupMongoReplSet() {
  const grunt = this.grunt;
  const servers = this.servers;

  return function() {
    const done = this.async();
    const command = this.args[0];

    const _doReplSet = function() {
      const client = new MongoClient(new Server(servers.host, servers.mongodb.port), {native_parser: true});

      client.open(function(err) {
        if (err) {
          grunt.log.error('MongoDB - Error when open a mongodb connection : ' + err);

          return done(false);
        }
        const db = client.db('admin');
        let replSetCommand = {
          _id: servers.mongodb.replicat_set_name,
          members: [
            {_id: 0, host: ('127.0.0.1:' + servers.mongodb.port)}
          ]
        };

        // Use replica set default config if run inside a docker container
        if (command === 'docker') {
          replSetCommand = null;
        }
        db.command({
          replSetInitiate: replSetCommand
        }, function(err, response) {
          if (err) {
            grunt.log.error('MongoDB - Error when executing rs.initiate() : ' + err);

            return done(false);
          }
          if (response && response.ok === 1) {
            grunt.log.writeln('MongoDB - rs.initiate() done');

            let nbExecuted = 0;
            let finish = false;

            async.doWhilst(function(callback) {
              setTimeout(function() {

                db.command({isMaster: 1}, function(err, response) {
                  if (err) {
                    grunt.log.error('MongoDB - Error when executing db.isMaster() : ' + err);

                    return done(false);
                  }
                  if (response.ismaster) {
                    finish = true;

                    return callback();
                  }
                  nbExecuted++;
                  if (nbExecuted >= servers.mongodb.tries_replica_set) {
                    return callback(new Error(
                      'Number of tries of check if the replica set is launch and have a master reached the maximum allowed. ' +
                      'Increase the number of tries or check if the mongodb "rs.initiate()" works'));
                  }

                  return callback();
                });
              }, servers.mongodb.interval_replica_set);

            }, function() {
              return (!finish) && nbExecuted < servers.mongodb.tries_replica_set;
            }, function(err) {
              if (err) {
                return done(false);
              }
              grunt.log.write('MongoDB - replica set launched and master is ready');
              done(true);
            });

          } else {
            grunt.log.writeln('MongoDB - rs.initiate() done but there are problems : ' + response);
            done(false);
          }
        });
      });
    };

    _doReplSet();
  };
};

GruntfileUtils.prototype.setupElasticsearchIndex = function() {
  const grunt = this.grunt;
  const servers = this.servers;
  const p = path.normalize(__dirname + '/../../config/elasticsearch/');

  return function() {
    const done = this.async();
    const esnConf = new EsnConfig({host: servers.host, port: servers.elasticsearch.port, path: p});

    Q.all([
      esnConf.createIndex('chat.messages'),
      esnConf.createIndex('chat.conversations')
    ]).then(function() {
      grunt.log.write('Elasticsearch settings are successfully added');
      done(true);
    }, done);
  };
};

module.exports = GruntfileUtils;
