'use strict';

var _ = require('lodash');

module.exports = function(dependencies, lib) {

  function getMessages(req, res) {
    lib.conversation.getMessages(req.params.channel, {}, function(err, results) {
      if (err) {
        return res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details: err.message || 'Error while getting messages'
          }
        });
      }

      return res.status(200).json(results);
    });
  }

  function getMessage(req, res) {
    lib.conversation.getMessage(req.params.id, function(err, message) {
      if (err) {
        return res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details: err.message || 'Error while getting message'
          }
        });
      }

      return res.status(200).json(message);
    });
  }

  function getChannels(req, res) {
    lib.conversation.getChannels({}, function(err, result) {
      if (err) {
        return res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details: err.message || 'Error while getting channels'
          }
        });
      }
      res.status(200).json(result);
    });
  }

  function getConversation(req, res) {
    lib.conversation.getConversation(req.params.id, function(err, result) {
      if (err) {
        return res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details: err.message || 'Error while getting channel'
          }
        });
      }
      res.status(200).json(result);
    });
  }

  function deleteConversation(req, res) {
    lib.conversation.deleteConversation(req.params.id, function(err, result) {
      if (err) {
        return res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details: err.message || 'Error while deleting channel'
          }
        });
      }
      res.status(200).json(result);
    });
  }

  function createConversation(req, res) {
    var members = [];

    if (req.body.members) {
      members = req.body.members.map(function(member) {
        return _.isString(member) ? member : member._id;
      });
    }

    if (members.indexOf(String(req.user._id)) === -1) {
      members.push(String(req.user._id));
    }

    lib.conversation.findPrivateByMembers(true, members, function(err, groups) {
      if (err) {
        return res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details: err.message || 'Error while finding groups with users' + members.join(', ')
          }
        });
      }

      if (groups && groups.length > 0) {
        res.status(201).json(groups[0]);
      } else {
        var conversation = {
          name: req.body.name,
          type: req.body.type,
          creator: req.user,
          topic: {
            value: req.body.topic,
            creator: req.user
          },
          members: members,
          purpose: {
            value: req.body.purpose,
            creator: req.user
          }
        };

        lib.conversation.createConversation(conversation, function(err, result) {
          if (err) {
            return res.status(500).json({
              error: {
                code: 500,
                message: 'Server Error',
                details: err.message || 'Error while creating channel'
              }
            });
          }
          res.status(201).json(result);
        });
      }
    });
  }

  function joinConversation(req, res) {
    lib.conversation.addMemberToConversation(req.params.id, req.user._id, function(err) {
      if (err) {
        return res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details: err.message || 'Error while joining channel'
          }
        });
      }
      res.status(204).end();
    });
  }

  function leaveConversation(req, res) {
    lib.conversation.removeMemberFromConversation(req.params.id, req.user._id, function(err) {
      if (err) {
        return res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details: err.message || 'Error while leaving channel'
          }
        });
      }
      res.status(204).end();
    });
  }

  function findPrivateByMembers(req, res) {
    if (!req.query.members) {
      return res.status(400).json({
        error: {
          code: 400,
          message: 'Bad request',
          details: 'members attribute is required'
        }
      });
    }

    var members = _.isArray(req.query.members) ? req.query.members : [req.query.members];

    if (members.indexOf(String(req.user._id)) === -1) {
      members.push(String(req.user._id));
    }

    lib.conversation.findPrivateByMembers(true, members, function(err, userGroups) {
      if (err) {
        return res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details: err.message || 'Error while finding groups with users' + members.join(', ')
          }
        });
      }
      res.status(200).json(userGroups);
    });
  }

  function findMyUsersGroups(req, res) {
    lib.conversation.findPrivateByMembers(false, [String(req.user._id)], function(err, usersGroups) {
      if (err) {
        return res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details: err.message || 'Error while finding groups of user ' + req.user._id
          }
        });
      }
      res.status(200).json(usersGroups);
    });
  }

  function getUserState(req, res) {
    lib.userState.get(req.params.id).then(function(state) {
      return res.status(200).json({
        state: state
      });
    }).catch(function(err) {
      res.status(500).json({
        error: {
          code: 500,
          message: 'Server Error',
          details: err.message || 'Error while fetching user state for user' + req.params.id
        }
      });
    });
  }

  function setMyState(req, res) {
    if (!req.body.state) {
      return res.status(400).json({
        error: {
          code: 400,
          message: 'Bad request',
          details: 'You should provide the user state'
        }
      });
    }

    lib.userState.set(req.user._id, req.body.state).then(function() {
      res.status(204).end();
    }).catch(function(err) {
      res.status(500).json({
        error: {
          code: 500,
          message: 'Server Error',
          details: err.message || 'Error while setting user state for user' + req.params.id
        }
      });
    });
  }

  function updateTopic(req, res) {
    var topic = {
      value: req.body.value,
      creator: req.user._id,
      last_set: new Date()
    };
    lib.conversation.updateTopic(req.params.id, topic, function(err, channel) {
      if (err) {
        return res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details: err.message || 'Error while update the topic for channel' + req.params.id
          }
        });
      }
      res.status(200).json(channel);
    });
  }

  return {
    getMessage: getMessage,
    getMessages: getMessages,
    getChannels: getChannels,
    getConversation: getConversation,
    findPrivateByMembers: findPrivateByMembers,
    findMyUsersGroups: findMyUsersGroups,
    getUserState: getUserState,
    setMyState: setMyState,
    joinConversation: joinConversation,
    leaveConversation: leaveConversation,
    deleteConversation: deleteConversation,
    createConversation: createConversation,
    updateTopic: updateTopic
  };
};
