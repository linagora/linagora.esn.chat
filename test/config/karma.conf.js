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
      'frontend/components/dynamic-directive/dist/dynamic-directive.min.js',
      'frontend/components/angular-uuid4/angular-uuid4.min.js',
      'frontend/components/restangular/dist/restangular.min.js',
      'frontend/components/sinon-chai/lib/sinon-chai.js',
      'frontend/components/sinon-1.15.4/index.js',
      'frontend/components/moment/moment.js',
      'frontend/components/angular-moment/angular-moment.js',
      'frontend/js/**/*.js',
      'test/unit-frontend/**/*.js',
      'frontend/views/**/*.jade'
    ],
    frameworks: ['mocha'],
    colors: true,
    singleRun: true,
    autoWatch: true,
    browsers: ['PhantomJS', 'Chrome', 'Firefox'],
    reporters: ['coverage', 'spec'],
    preprocessors: {
      'frontend/js/**/*.js': ['coverage'],
      '**/*.jade': ['ng-jade2module']
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
      prependPrefix: '/linagora.esn.gsafe',
      // setting this option will create only a single module that contains templates
      // from all the files, so you can load them all with module('templates')
      jadeRenderConfig: {
        __: function(str) {
          return str;
        }
      },
      moduleName: 'jadeTemplates'
    }

  });
};
