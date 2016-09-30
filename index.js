'use strict';

let AwesomeModule = require('awesome-module');
let Dependency = AwesomeModule.AwesomeModuleDependency;
let path = require('path');
let glob = require('glob-all');
let _ = require('lodash');

const NAME = 'chat';
const MODULE_NAME = 'linagora.esn.' + NAME;
const FRONTEND_JS_PATH = __dirname + '/frontend/app/';

let chatModule = new AwesomeModule(MODULE_NAME, {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.logger', 'logger'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.auth', 'auth'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.pubsub', 'pubsub'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.esn-config', 'esn-config'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.middleware.authorization', 'authorizationMW'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.user', 'user'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.middleware.token', 'tokenMW'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.wsserver', 'wsserver'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.helpers', 'helpers'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.db', 'db'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.emoticon', 'emoticon')
  ],
  states: {
    lib: function(dependencies, callback) {
      let libModule = require('./backend/lib')(dependencies);
      let chat = require('./backend/webserver/api')(dependencies, libModule);
      let lib = {
        api: {
          chat: chat
        },
        lib: libModule
      };

      callback(null, lib);
    },

    deploy: function(dependencies, callback) {
      let webserverWrapper = dependencies('webserver-wrapper');
      let app = require('./backend/webserver/application')(this, dependencies);
      let lessFile = path.resolve(__dirname, './frontend/app/styles.less');
      let frontendModules = glob.sync([
        FRONTEND_JS_PATH + '**/!(*spec).js'
      ]).map(filepath => filepath.replace(FRONTEND_JS_PATH, ''));

      _.pull(frontendModules, 'app.js');
      frontendModules = ['app.js'].concat(frontendModules);

      app.use('/api/chat', this.api.chat);
      webserverWrapper.injectAngularAppModules(NAME, frontendModules, MODULE_NAME, ['esn']);
      webserverWrapper.injectLess(NAME, [lessFile], 'esn');
      webserverWrapper.addApp(NAME, app);

      callback();
    },

    start: function(dependencies, callback) {
      require('./backend/ws').init(dependencies, this.lib);
      this.lib.start(callback);
    }
  }
});

module.exports = chatModule;
