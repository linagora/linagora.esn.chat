'use strict';

angular.module('linagora.esn.chat')

  .controller('chatRootController', function($scope, $rootScope, CHAT_EVENTS, chatNotification, chatLocalStateService) {
    $scope.isEnabled = function() {
      return chatNotification.isEnabled();
    };

    $scope.chatLocalStateService = chatLocalStateService;
    if (!chatLocalStateService.activeRoom._id) {
      chatLocalStateService.setActive(chatLocalStateService.channels[0]._id);
    }
  })

  .controller('chatAddChannelController', function($scope, CHAT_CONVERSATION_TYPE, $state, conversationsService, chatLocalStateService) {
    $scope.addChannel = function() {
      var channel = {
        name: $scope.channel.name,
        type: CHAT_CONVERSATION_TYPE.CHANNEL,
        topic: $scope.channel.topic || '',
        purpose: $scope.channel.purpose || ''
      };

      conversationsService.addChannels(channel).then(function(response) {
        chatLocalStateService.addConversation(response.data);
        $state.go('chat.channels-views', {id: response.data._id});
      });
    };
  })

  .controller('chatConversationItemController', function($scope, $rootScope, $q, _, CHAT_EVENTS, CHAT_CONVERSATION_TYPE, chatUserState, session, moment, userUtils) {
    $scope.channelState = $scope.channelState || 'chat.channels-views';
    $scope.allUsersConnected = true;
    var userToConnected = {};
    if ($scope.item.last_message) {
      $scope.numberOfDays = calcNumberOfDays($scope.item.last_message);
    }

    function calcNumberOfDays(last_message) {
      var d1 = moment().startOf('day');
      var d2 = moment(last_message.date);
      var numberDay = moment.duration(d1.diff(d2)).asDays() + 1;
      return parseInt(numberDay);
    }

    function computeIsConnected() {
      $scope.allUsersConnected = _(userToConnected).values().every();
    }

    function setLastMessageIsMe(message) {
      $scope.lastMessageIsMe = message.creator._id === session.user._id;
      if (!$scope.lastMessageIsMe) {
        $scope.lastMessageDisplayName = userUtils.displayNameOf(message.creator);
      }
    }

    session.ready.then(function(session) {
      $scope.otherUsers = _.reject($scope.item.members, {_id: session.user._id});
      if ($scope.item.type === CHAT_CONVERSATION_TYPE.PRIVATE && $scope.otherUsers.length > 1) {
        $scope.item.name = _.map($scope.otherUsers, 'firstname').join(', ');
      }

      if ($scope.item.last_message.creator) {
        setLastMessageIsMe($scope.item.last_message);
      }

      var statesPromises = $scope.otherUsers.map(function(member) {
          return chatUserState.get(member._id).then(function(state) {
            userToConnected[member._id] = state !== 'disconnected';
          });
        });

      $q.all(statesPromises).then(computeIsConnected);

      var unbind = $rootScope.$on(CHAT_EVENTS.USER_CHANGE_STATE, function(event, data) {
        if (angular.isDefined(userToConnected[data.userId])) {
          userToConnected[data.userId] = data.state !== 'disconnected';
          computeIsConnected();
        }
      });

      $rootScope.$on(CHAT_EVENTS.TEXT_MESSAGE, function(event, message) {
        setLastMessageIsMe(message);
        $scope.numberOfDays = calcNumberOfDays(message);
      });

      $scope.$on('$destroy', unbind);
      $scope.CHAT_CONVERSATION_TYPE = CHAT_CONVERSATION_TYPE;
    });
  })

  .controller('chatAddGroupController', function($scope, $state, conversationsService, _, chatLocalStateService) {
    $scope.members = [];
    $scope.addGroup = function() {
      var group = {
        members: $scope.members
      };

      conversationsService.addPrivateConversation(group).then(function(response) {
        chatLocalStateService.addConversation(response.data);
        $state.go('chat.channels-views', { id: response.data._id});
      });
    };
  })

  .controller('chatConversationSubheaderController', function($scope, chatLocalStateService) {
    $scope.chatLocalStateService = chatLocalStateService;
  });
