'use strict';

var mockery = require('mockery');
var chai = require('chai');
var path = require('path');
var fs = require('fs-extra');
var testConfig = require('../config/servers-conf');
var bodyParser = require('body-parser');
var MongoClient = require('mongodb').MongoClient;
var redis = require('redis');
var async = require('async');

before(function() {
  chai.use(require('chai-shallow-deep-equal'));
  chai.use(require('sinon-chai'));
  chai.use(require('chai-as-promised'));
  var basePath = path.resolve(__dirname + '/../..');
  var tmpPath = path.resolve(basePath, testConfig.tmp);
  var host = testConfig.host;
  var testEnv = this.testEnv = {
    serversConfig: testConfig,
    basePath: basePath,
    tmp: tmpPath,
    fixtures: path.resolve(__dirname + '/fixtures'),
    mongoUrl: 'mongodb://' + host + ':' + testConfig.mongodb.port + '/' + testConfig.mongodb.dbname,
    redisPort: testConfig.redis.port,
    writeDBConfigFile: function() {
      fs.writeFileSync(tmpPath + '/db.json', JSON.stringify({connectionString: 'mongodb://' + host + ':' + testConfig.mongodb.port + '/' + testConfig.mongodb.dbname, connectionOptions: {auto_reconnect: false}}));
    },
    removeDBConfigFile: function() {
      fs.unlinkSync(tmpPath + '/db.json');
    },
    writeDefaultConfigFile: function() {
      fs.writeFileSync(tmpPath + '/default.json', JSON.stringify({
        wsserver: {enabled: true, port: testConfig.express.port},
        webserver: {
          port: testConfig.express.port
        },
        log: {
          console: {
            enabled: true
          },
          file: {
            enabled: false
          },
          rotate: {
            enabled: false
          }
        }
      }));
    },
    removeDefaultConfigFile: function() {
      fs.unlinkSync(tmpPath + '/default.json');
    }
  };
  var self = this;

  this.helpers = {};

  this.helpers.asMember = function(user) {
    return {member: {id: String(user._id || user), objectType: 'user'}};
  };

  this.helpers.loadApplication = function(dependencies, skipModels) {
    const lib = require('../../backend/lib')(dependencies);
    const mongoose = dependencies('db').mongo.mongoose;
    const ObjectId = mongoose.Schema.ObjectId;

    if (!skipModels) {
      mongoose.model('User', new mongoose.Schema({
        _id: {type: ObjectId, required: true},
        username: {type: String, required: true},
        domains: [{
          domain_id: {type: String}
        }]
      }));
    }

    const api = require('../../backend/webserver/api')(dependencies, lib);
    const app = require('../../backend/webserver/application')(dependencies);
    const ws = require('../../backend/ws');

    app.use(bodyParser.json());
    app.use('/api', api);

    return {
      express: app,
      lib,
      api,
      ws
    };
  };

  const i18nMock = require('i18n');

  i18nMock.setDefaultConfiguration = function(options) {
    const i18nConfigTemplate = {
      defaultLocale: 'en',
      locales: ['en', 'fr', 'vi'],
      updateFiles: false,
      indent: '  ',
      extension: '.json',
      cookie: 'locale'
    };

    const i18nConfig = Object.assign({}, i18nConfigTemplate, options);

    i18nMock.configure(i18nConfig);
  };

  this.helpers.i18n = i18nMock;

  this.helpers.resetRedis = function(callback) {
    var redisClient = redis.createClient(testEnv.redisPort);

    return redisClient.flushall(callback);
  };

  this.helpers.mongo = {
    dropDatabase: function(callback) {
      function _dropDatabase() {
        MongoClient.connect(self.testEnv.mongoUrl, function(err, db) {
          if (err) {
            return callback(err);
          }
          db.dropDatabase(function(err) {
            if (err) {
              return _dropDatabase();
            }
            db.close(callback);
          });
        });
      }
      _dropDatabase();
    }
  };

  this.helpers.elasticsearch = {

    checkDocumentsIndexed: function(options, callback) {
      var request = require('superagent');
      var elasticsearchURL = self.testEnv.serversConfig.host + ':' + self.testEnv.serversConfig.elasticsearch.port;
      var index = options.index;
      var type = options.type;
      var ids = options.ids;
      var check = options.check || function(res) {
        return res.status === 200 && res.body.hits.total === 1;
      };

      async.each(ids, function(id, callback) {
        var nbExecuted = 0;
        var finish = false;

        async.doWhilst(function(callback) {
          setTimeout(function() {
            request
              .get(elasticsearchURL + '/' + index + '/' + type + '/_search?q=_id:' + id)
              .end(function(err, res) {
                if (check(res)) {
                  finish = true;

                  return callback();
                }
                nbExecuted++;
                if (nbExecuted >= self.testEnv.serversConfig.elasticsearch.tries_index) {
                  return callback(new Error(
                    'Number of tries of check document indexed in Elasticsearch reached the maximum allowed. Increase the number of tries!'));
                }

                return callback();
              });
          }, self.testEnv.serversConfig.elasticsearch.interval_index);

        }, function() {
          return (!finish) && nbExecuted < self.testEnv.serversConfig.elasticsearch.tries_index;
        }, function(err) {
          callback(err);
        });

      }, function(err) {
        callback(err);
      });
    }
  };

  process.env.NODE_CONFIG = this.testEnv.tmp;
  process.env.NODE_ENV = 'test';
});

after(function() {
  delete process.env.NODE_CONFIG;
  delete process.env.NODE_ENV;
});

beforeEach(function() {
  mockery.enable({warnOnReplace: false, warnOnUnregistered: false, useCleanCache: true});
  this.testEnv.writeDBConfigFile();
  this.testEnv.writeDefaultConfigFile();
});

afterEach(function() {
  try {
    this.testEnv.removeDBConfigFile();
    this.testEnv.removeDefaultConfigFile();
  } catch (e) {
    /*eslint no-console: ["error", { allow: ["error"] }] */
    console.error(e);
  }
  mockery.resetCache();
  mockery.deregisterAll();
  mockery.disable();
});
