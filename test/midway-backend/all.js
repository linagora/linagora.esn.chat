'use strict';

var mockery = require('mockery');
var chai = require('chai');
var path = require('path');
var fs = require('fs-extra');
var testConfig = require('../config/servers-conf');
var bodyParser = require('body-parser');
var MongoClient = require('mongodb').MongoClient;
var redis = require('redis');

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
    }
  };
  var self = this;

  this.helpers = {};
  this.helpers.loadApplication = function(dependencies) {
    var lib = require('../../backend/lib')(dependencies);

    var mongoose = dependencies('db').mongo.mongoose;
    var ObjectId = mongoose.Schema.ObjectId;
    mongoose.model('User', new mongoose.Schema({
      _id: {type: ObjectId, required: true},
      username: {type: String, required: true},
    }));

    var api = require('../../backend/webserver/api')(dependencies, lib);
    var app = require('../../backend/webserver/application')(dependencies);
    app.use(bodyParser.json());
    app.use('/api', api);
    return {
      express: app,
      lib: lib,
      api: api
    };
  };

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
              console.log('Error while droping the database, retrying...', err);
              return _dropDatabase();
            }
            db.close(callback);
          });
        });
      }
      _dropDatabase();
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
});

afterEach(function() {
  try {
    this.testEnv.removeDBConfigFile();
  } catch (e) {
    console.error(e);
  }
  mockery.resetCache();
  mockery.deregisterAll();
  mockery.disable();
});
