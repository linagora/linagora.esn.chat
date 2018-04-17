'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The chatDesktopNotificationService service', function() {
  var $q,
    $rootScope,
    user,
    session,
    chatConversationMemberService,
    chatConversationsStoreService,
    chatDesktopNotificationService,
    chatParseMention,
    localStorageService,
    localForage,
    webNotification,
    $window,
    CHAT_NOTIFICATION,
    CHAT_LOCAL_STORAGE;

  beforeEach(
    angular.mock.module('linagora.esn.chat', function($provide) {
      $provide.value('searchProviders', {
        add: sinon.spy()
      });
      $provide.value('chatSearchProviderService', {});
    })
  );

  beforeEach(function() {
    user = {_id: 'userId'};
    session = {
      user: user
    };
    chatConversationMemberService = {
      currentUserIsMemberOf: sinon.spy(function() {
        return true;
      })
    };
    chatConversationsStoreService = {
      find: sinon.spy()
    };
    localForage = {
      getItem: sinon.spy(),
      setItem: sinon.spy()
    };
    localStorageService = {
      getOrCreateInstance: sinon.stub().returns(localForage)
    };
    webNotification = {
      permissionGranted: true,
      showNotification: sinon.spy()
    };
    chatParseMention = {
      parseMentions: sinon.spy(function() {
        return $q.when();
      })
    };

    angular.mock.module(function($provide) {
      $provide.value('session', session);
      $provide.value('chatParseMention', chatParseMention);
      $provide.value('chatConversationMemberService', chatConversationMemberService);
      $provide.value('chatConversationsStoreService', chatConversationsStoreService);
      $provide.value('localStorageService', localStorageService);
      $provide.value('webNotification', webNotification);
    });
  });

  beforeEach(angular.mock.inject(function(_$q_, _$rootScope_, _$window_, _chatDesktopNotificationService_, _CHAT_LOCAL_STORAGE_, _CHAT_NOTIFICATION_) {
    $q = _$q_;
    $rootScope = _$rootScope_;
    $window = _$window_;
    chatDesktopNotificationService = _chatDesktopNotificationService_;
    CHAT_LOCAL_STORAGE = _CHAT_LOCAL_STORAGE_;
    CHAT_NOTIFICATION = _CHAT_NOTIFICATION_;
  }));

  describe('chatDesktopNotificationService service', function() {
    describe('The start method', function() {
      it('should set the enable flag from localstorage value if found', function() {
        localForage.getItem = sinon.spy(function() {
          return $q.when(true);
        });

        chatDesktopNotificationService.start();
        $rootScope.$digest();

        expect(localForage.getItem).to.have.been.calledWith(CHAT_LOCAL_STORAGE.DESKTOP_NOTIFICATION);
        expect(chatDesktopNotificationService.isEnabled()).to.be.true;
      });

      it('should set the enable flag to the webNotification.permissionGranted value if falsy in local storage', function() {
        localForage.getItem = sinon.spy(function() {
          return $q.when(false);
        });
        webNotification.permissionGranted = true;

        chatDesktopNotificationService.start();
        $rootScope.$digest();

        expect(localForage.getItem).to.have.been.calledWith(CHAT_LOCAL_STORAGE.DESKTOP_NOTIFICATION);
        expect(localForage.setItem).to.have.been.calledWith(CHAT_LOCAL_STORAGE.DESKTOP_NOTIFICATION, JSON.stringify(webNotification.permissionGranted));
        expect(chatDesktopNotificationService.isEnabled()).to.equal(webNotification.permissionGranted);
      });

      it('should set the enable flag to false when localstorage fails', function() {
        localForage.getItem = sinon.spy(function() {
          return $q.reject(new Error('I failed'));
        });

        chatDesktopNotificationService.start();
        $rootScope.$digest();

        expect(localForage.getItem).to.have.been.calledWith(CHAT_LOCAL_STORAGE.DESKTOP_NOTIFICATION);
        expect(chatDesktopNotificationService.isEnabled()).to.be.false;
      });
    });

    describe('The canNotify function', function() {
      it('should return false when window has focus and enable is false', function() {
        $window.document.hasFocus = sinon.spy(function() {
          return false;
        });
        chatDesktopNotificationService.setNotificationStatus(false);

        expect(chatDesktopNotificationService.canNotify()).to.not.be.ok;
        expect($window.document.hasFocus).to.have.been.called;
      });

      it('should return false when window has focus and enable is true', function() {
        $window.document.hasFocus = sinon.spy(function() {
          return true;
        });
        chatDesktopNotificationService.setNotificationStatus(true);

        expect(chatDesktopNotificationService.canNotify()).to.not.be.ok;
        expect($window.document.hasFocus).to.have.been.called;
      });

      it('should return false when window does not have focus and enable is false', function() {
        $window.document.hasFocus = sinon.spy(function() {
          return false;
        });
        chatDesktopNotificationService.setNotificationStatus(false);

        expect(chatDesktopNotificationService.canNotify()).to.not.be.ok;
        expect($window.document.hasFocus).to.have.been.called;
      });

      it('should return true when window does not have focus and enable is true', function() {
        $window.document.hasFocus = sinon.spy(function() {
          return false;
        });
        chatDesktopNotificationService.setNotificationStatus(true);

        expect(chatDesktopNotificationService.canNotify()).to.be.ok;
        expect($window.document.hasFocus).to.have.been.called;
      });
    });

    describe('The notify function', function() {
      var title;

      beforeEach(function() {
        title = 'My Title';
      });

      it('should notify with default options when not defined', function() {
        chatDesktopNotificationService.notify(title);

        expect(webNotification.showNotification).to.have.been.calledWith(title, {icon: CHAT_NOTIFICATION.DEFAULT_ICON, autoClose: CHAT_NOTIFICATION.AUTO_CLOSE}, sinon.match.func);
      });

      it('should notify with icon when defined', function() {
        var icon = 'foobar';

        chatDesktopNotificationService.notify(title, {icon: icon});

        expect(webNotification.showNotification).to.have.been.called;
        expect(webNotification.showNotification.firstCall.args[1]).to.shallowDeepEqual({icon: icon});
      });

      it('should notify with autoClose when defined', function() {
        var autoclose = 'autocloseMe';

        chatDesktopNotificationService.notify(title, {autoclose: autoclose});

        expect(webNotification.showNotification).to.have.been.called;
        expect(webNotification.showNotification.firstCall.args[1]).to.shallowDeepEqual({autoclose: autoclose});
      });

      it('should notify with onShow callback when defined', function() {
        var onShow = function() {};

        chatDesktopNotificationService.notify(title, {}, onShow);

        expect(webNotification.showNotification).to.have.been.called;
        expect(webNotification.showNotification.firstCall.args[2]).to.equal(onShow);
      });
    });

    describe('The notifyMessage function', function() {
      var message;

      beforeEach(function() {
        message = {_id: 1};
        $window.document.hasFocus = sinon.spy(function() {
          return false;
        });
        chatDesktopNotificationService.setNotificationStatus(true);
      });

      it('should not notify when message is from current user', function() {
        message.creator = session.user._id;

        chatDesktopNotificationService.notifyMessage(message);

        expect(chatConversationsStoreService.find).to.not.have.been.called;
        expect(chatParseMention.parseMentions).to.not.have.been.called;
        expect(webNotification.showNotification).to.not.have.been.called;
      });

      it('should not notify if conversation is not found in store', function() {
        message.creator = '!' + session.user._id;
        message.channel = '1';
        chatConversationsStoreService.find = sinon.spy();

        chatDesktopNotificationService.notifyMessage(message);

        expect(chatConversationsStoreService.find).to.have.been.calledWith(message.channel);
        expect(chatParseMention.parseMentions).to.not.have.been.called;
        expect(webNotification.showNotification).to.not.have.been.called;
      });

      it('should not notify if user is not conversation member', function() {
        chatConversationMemberService.currentUserIsMemberOf = sinon.spy(function() {
          return false;
        });

        var conversation = {_id: '123', name: 'My conversation'};

        message.creator = '!' + session.user._id;
        message.channel = '1';
        message.text = 'This is my message';
        message.user_mentions = [1, 2, 3];
        chatParseMention.parseMentions = sinon.spy();
        chatConversationsStoreService.find = sinon.spy(function() {
          return conversation;
        });

        chatDesktopNotificationService.notifyMessage(message);

        expect(chatConversationMemberService.currentUserIsMemberOf).to.have.been.calledWith(conversation);
        expect(chatConversationsStoreService.find).to.have.been.calledWith(message.channel);
        expect(chatParseMention.parseMentions).to.not.have.been.called;
        expect(webNotification.showNotification).to.not.have.been.called;
      });

      it('should notify with message text and user icon', function() {
        var conversation = {_id: '123', name: 'My conversation'};
        var parsedText = 'This is some parsed text';

        message.creator = '!' + session.user._id;
        message.channel = '1';
        message.text = 'This is my message';
        message.user_mentions = [1, 2, 3];
        chatConversationsStoreService.find = sinon.spy(function() {
          return conversation;
        });
        chatParseMention.parseMentions = sinon.spy(function() {
          return $q.when(parsedText);
        });

        chatDesktopNotificationService.notifyMessage(message);

        $rootScope.$digest();

        expect(chatConversationsStoreService.find).to.have.been.calledWith(message.channel);
        expect(chatParseMention.parseMentions).to.have.been.calledWith(message.text, message.user_mentions, {skipLink: true});
        expect(webNotification.showNotification).to.have.been.calledWith('New message in ' + conversation.name, {
          body: parsedText,
          icon: '/api/users/' + message.creator + '/profile/avatar',
          autoClose: CHAT_NOTIFICATION.AUTO_CLOSE
        },
        sinon.match.func);
      });
    });

    describe('The setNotificationStatus function', function() {
      it('should save value in local storage and in enable flag', function() {
        var value = true;

        chatDesktopNotificationService.setNotificationStatus(value);

        expect(localForage.setItem).to.have.been.calledWith(CHAT_LOCAL_STORAGE.DESKTOP_NOTIFICATION, JSON.stringify(value));
        expect(chatDesktopNotificationService.isEnabled()).to.be.true;
      });
    });
  });
});
