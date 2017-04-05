'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('the chatBotMessageNotMemberMentionHandler service', function() {
  var $q, chatParseMention, chatBotMessageService, chatBotMessageNotMemberMentionHandler, CHAT_BOT;

  beforeEach(function() {
    chatParseMention = {};

    angular.mock.module('linagora.esn.chat', function($provide) {
      $provide.value('chatSearchConversationsProviderService', {});
      $provide.value('searchProviders', {add: sinon.spy()});
      $provide.value('chatSearchMessagesProviderService', {});
      $provide.value('chatSearchConversationsProviderService', {});
      $provide.value('chatParseMention', chatParseMention);
    });

    angular.mock.inject(function(_$q_, _chatBotMessageService_, _chatBotMessageNotMemberMentionHandler_, _CHAT_BOT_) {
      $q = _$q_;
      chatBotMessageService = _chatBotMessageService_;
      chatBotMessageNotMemberMentionHandler = _chatBotMessageNotMemberMentionHandler_;
      CHAT_BOT = _CHAT_BOT_;
    });
  });

  describe('the register function', function() {
    it('should call chatBotMessageNotMemberMentionHandler when type is text', function() {
      var message = {
        subtype: CHAT_BOT.MESSAGE_SUBTYPES.NOT_MEMBER_MENTION,
        user_mentions: [{ _id: 'userId' }]
      };
      var userMentionText = '@userId';

      chatParseMention.parseMentions = sinon.spy(function(text) {
        return $q.when(text);
      });
      chatBotMessageService.register(chatBotMessageNotMemberMentionHandler.type, chatBotMessageNotMemberMentionHandler.setText);
      chatBotMessageService.resolve(message.subtype, message);

      expect(message.text).to.equal(userMentionText);
      expect(chatParseMention.parseMentions).to.have.been.calledWith(message.text, message.user_mentions);
    });

    it('should correctky set message text on multiple mentions', function() {
      var message = {
        subtype: CHAT_BOT.MESSAGE_SUBTYPES.NOT_MEMBER_MENTION,
        user_mentions: [{ _id: 'userId' }, { _id: 'userId2' }, { _id: 'userId3' }]
      };
      var userMentionText = '@userId, @userId2, @userId3';

      chatParseMention.parseMentions = sinon.spy(function(text) {
        return text;
      });
      chatBotMessageService.register(chatBotMessageNotMemberMentionHandler.type, chatBotMessageNotMemberMentionHandler.setText);
      chatBotMessageService.resolve(message.subtype, message);

      expect(message.text).to.equal(userMentionText);
      expect(chatParseMention.parseMentions).to.have.been.calledWith(message.text, message.user_mentions);
    });
  });
});
