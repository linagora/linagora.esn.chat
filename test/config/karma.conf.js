'use strict';

module.exports = function(config) {
  config.set({
    basePath: '../../',
    files: [
      'frontend/components/chai/chai.js',
      'node_modules/chai-shallow-deep-equal/chai-shallow-deep-equal.js',
      'frontend/components/lodash/dist/lodash.min.js',
      'frontend/components/jquery/dist/jquery.min.js',
      'frontend/components/angular/angular.js',
      'frontend/components/angular-ui-router/release/angular-ui-router.min.js',
      'frontend/components/angular-mocks/angular-mocks.js',
      'test/mocks/ng-mock-component.js',
      'frontend/components/angular-component/dist/angular-component.min.js',
      'frontend/components/dynamic-directive/dist/dynamic-directive.min.js',
      'frontend/components/angular-uuid4/angular-uuid4.min.js',
      'frontend/components/restangular/dist/restangular.min.js',
      'frontend/components/sinon-chai/lib/sinon-chai.js',
      'node_modules/sinon/pkg/sinon.js',
      'frontend/components/moment/moment.js',
      'frontend/components/lodash/dist/lodash.js',
      'frontend/components/angular-moment/angular-moment.js',
      'frontend/components/angular-web-notification/angular-web-notification.js',
      'frontend/components/html5-desktop-notifications2/dist/Notification.min.js',
      'frontend/components/angular-file-upload/dist/angular-file-upload-all.js',
      'frontend/components/angular-xeditable/dist/js/xeditable.js',
      'frontend/components/angular-sanitize/angular-sanitize.min.js',
      'frontend/components/zInfiniteScroll/zInfiniteScroll.js',
      'frontend/components/angular-inview/angular-inview.js',
      'test/config/module.js',
      'frontend/app/chat.module.js',
      'frontend/app/**/*.js',
      'frontend/app/**/*.pug'
    ],
    exclude: [
      'frontend/app/chat.module.run.js',
      'frontend/app/services/messaging/messaging.run.js',
      'frontend/app/conversation/attachments/conversation-attachments.run.js'
    ],
    frameworks: ['mocha'],
    colors: true,
    singleRun: true,
    autoWatch: true,
    browsers: ['PhantomJS', 'Chrome', 'Firefox'],
    reporters: ['coverage', 'spec'],
    preprocessors: {
      'frontend/js/**/*.js': ['coverage'],
      '**/*.pug': ['ng-jade2module']
    },

    plugins: [
      'karma-phantomjs-launcher',
      'karma-chrome-launcher',
      'karma-firefox-launcher',
      'karma-mocha',
      'karma-coverage',
      'karma-spec-reporter',
      'karma-ng-jade2module-preprocessor'
    ],

    coverageReporter: {type: 'text', dir: '/tmp'},

    ngJade2ModulePreprocessor: {
      stripPrefix: 'frontend',
      cacheIdFromPath: function(filepath) {
        var cacheId = filepath.replace(/pug$/, 'html').replace(/^frontend/, '/chat');

return cacheId;
      },
      prependPrefix: '/linagora.esn.chat',
      // setting this option will create only a single module that contains templates
      // from all the files, so you can load them all with module('templates')
      jadeRenderOptions: {
        basedir: require('path').resolve(__dirname, '../../node_modules/linagora-rse/frontend/views')
      },
      jadeRenderLocals: {
        __: function(str) {
          return str;
        }
      },
      moduleName: 'jadeTemplates'
    }

  });
};
