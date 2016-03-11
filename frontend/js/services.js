'use strict';

angular.module('linagora.esn.chat')

  .factory('ChatConversationService', function($q, session) {

    /**
     * Fetch conversation history for the current user
     *
     * @param options
     * @returns {Promise}
     */
    function fetchHistory(options) {
      var history = [
        {
          channel_name: '#openpaas',
          last_message: {
            user: {displayName: 'Davil Parnell'},
            text: 'Hello, how are you?!',
            date: Date.now()
          }
        },
        {
          channel_name: '@christophe',
          last_message: {
            user: {displayName: 'Ann Watkinson'},
            text: 'This is fun, thx again',
            date: Date.now()
          }
        },
        {
          channel_name: '#barcamp',
          last_message: {
            user: {displayName: 'Jeremy Robbins'},
            text: 'See you on monday guys, have a nice weekend',
            date: Date.now()
          }
        },
        {
          channel_name: '#todo',
          last_message: {
            user: {displayName: 'Jeremy Robbins'},
            text: 'YOLO!',
            date: Date.now()
          }
        }
      ];

      return $q.when(history);
    }

    function fetchMessages(options) {
      
      var user = session.user;
      user.displayName = '@chamerling';

      var messages = [
        {
          user: user,
          text: 'Hello, how are you?!',
          date: Date.now()
        },
        {
          user: user,
          text: 'Mauris volutpat magna nibh, et condimentum est rutrum a. Nunc sed turpis mi. In eu massa a sem pulvinar lobortis.',
          date: Date.now()
        },
        {
          user: user,
          text: 'Etiam ex arcumentum',
          date: Date.now()
        },
        {
          user: user,
          text: 'Etiam nec facilisis lacus. Nulla imperdiet augue ullamcorper dui ullamcorper, eu laoreet sem consectetur. Aenean et ligula risus. Praesent sed posuere sem. Cum sociis natoque penatibus et magnis dis parturient montes',
          date: Date.now()
        },
        {
          user: user,
          text: 'Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Etiam ac tortor ut elit sodales varius. Mauris id ipsum id mauris malesuada tincidunt. Vestibulum elit massa, pulvinar at sapien sed, luctus vestibulum eros. Etiam finibus tristique ante, vitae rhoncus sapien volutpat eget',
          date: Date.now()
        }
      ];

      messages.forEach(function(message, index) {
        message.date = message.date + index;
      });
      return $q.when(messages);
    }

    return {
      fetchHistory: fetchHistory,
      fetchMessages: fetchMessages
    };
  })

  .factory('ChatService', function($q, $log) {

    function sendMessage(message) {
      $log.debug('Send message', message);
      return $q.when(message);
    }

    return {
      sendMessage: sendMessage
    };

  });
