'use strict';

/* global _: false */

angular.module('esn.cache', []);
angular.module('esn.highlight', []);
angular.module('esn.attachment', []);
angular.module('esn.attachment-list', []);
angular.module('esn.pagination', []);
angular.module('esn.router', []);
angular.module('esn.search', []);
angular.module('esn.scroll', []);
angular.module('esn.attendee', []);
angular.module('esn.header', []);
angular.module('esn.sidebar', []);
angular.module('esn.url', []);
angular.module('esn.oembed', []);
angular.module('esn.oembed.image', []);
angular.module('esn.localstorage', []);
angular.module('esn.file', []);
angular.module('esn.collaboration', []);
angular.module('esn.lodash-wrapper', []);
angular.module('esn.provider', [])
  .factory('newProvider', function() {});
angular.module('esn.user', []);
angular.module('esn.core', [])
.constant('_', _)
.constant('routeResolver', {
  session: function(key) {
    return ['$q', function($q) {
      var session = {
        user: {
          _id: 'id'
        },
        domain: 'domain'
      };

      return $q.when(session[key]);
    }];
  }
});
angular.module('linagora.esn.emoticon', []);
angular.module('linagora.esn.user-status', []);
angular.module('esn.file-preview', []);
angular.module('luegg.directives', []);
angular.module('esn.module-registry', [])
  .factory('esnModuleRegistry', function() {
    return {};
  });
angular.module('esn.datetime', []);
angular.module('esn.app-state', [])
  .constant('ESN_APP_STATE_CHANGE_EVENT', 'esn:app:state:changed')
  .factory('esnAppStateService', function() {
    return {};
  });
