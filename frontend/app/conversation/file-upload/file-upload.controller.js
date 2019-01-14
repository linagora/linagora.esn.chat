(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .controller('chatFileUploadController', chatFileUploadController);

  function chatFileUploadController(
    $q,
    $log,
    $filter,
    $scope,
    $modal,
    _,
    notificationFactory,
    session,
    chatConversationMemberService,
    chatConversationsStoreService,
    chatMessageService,
    esnConfig,
    MAX_SIZE_UPLOAD_DEFAULT
  ) {
    var self = this;

    self.onFileSelect = onFileSelect;
    self.uploadLargeFiles = uploadLargeFiles;

    function buildCurrentMessage() {
      return {
        text: '',
        creator: session.user._id,
        channel: chatConversationsStoreService.activeRoom._id,
        date: Date.now()
      };
    }

    function onFileSelect(files) {
      if (!files || !files.length) {
        // onFileSelect may be called on button click before selecting files
        return $q.when();
      }

      if (!chatConversationMemberService.currentUserIsMemberOf(chatConversationsStoreService.activeRoom)) {
        notificationFactory.weakError('error', 'You can not upload files without being a member');

        return $q.when();
      }

      return esnConfig('core.maxSizeUpload', MAX_SIZE_UPLOAD_DEFAULT).then(function(maxSizeUpload) {
        var largeFiles = [];
        var regularFiles = [];

        for (var i = 0, file = files[i]; i < files.length; file = files[++i]) {
          if (file.size > maxSizeUpload) {
            largeFiles.push(file);
          } else {
            regularFiles.push(file);
          }
        }

        $log.debug('Sending message with attachments', regularFiles);
        $log.debug('Large files will be rejected', largeFiles);

        var largeFilesPromise = largeFiles.length > 0 ?
                                self.uploadLargeFiles(largeFiles, maxSizeUpload) :
                                $q.when([]);

        return largeFilesPromise.then(function() {
          if (regularFiles.length > 0) {
            chatMessageService
              .sendMessageWithAttachments(buildCurrentMessage(), regularFiles)
              .catch(_.partial($log.error, 'Error while sending message with attachments'));
          }
        });
      });
    }

    function uploadLargeFiles(files, maxSizeUpload) {
      var deferred = $q.defer();

      $modal({
        templateUrl: '/views/modules/attachment-alternative-uploader-modal-no-uploader/attachment-alternative-uploader-modal-no-uploader.html',
        container: 'body',
        backdrop: 'static',
        placement: 'center',
        controller: function() {
          var self = this;

          self.$onInit = $onInit;
          self.cancel = _.partial(deferred.resolve, []);

          function $onInit() {
            self.files = files.map(function(file) {
              return {
                name: file.name,
                size: file.size
              };
            });
            self.humanReadableMaxSizeUpload = $filter('bytes')(maxSizeUpload);
          }
        },
        controllerAs: '$ctrl'
      });

      return deferred.promise;
    }
  }
})();
