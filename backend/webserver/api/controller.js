'use strict';

var _ = require('lodash');

module.exports = function(dependencies, lib) {

  function getMessages(req, res) {
    lib.channel.getMessages(req.params.channel, {}, function(err, results) {
      if (err) {
        return res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details: err.message || 'Error while getting messages'
          }
        });
      }

      results = results.map(function(message) {
        delete message.password;
        return message;
      });

      return res.status(200).json(results);
    });
  }

  function getChannels(req, res) {
    lib.channel.getChannels({}, function(err, result) {
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

  function getChannel(req, res) {
    lib.channel.getChannel(req.params.id, function(err, result) {
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

  function deleteChannel(req, res) {
    lib.channel.deleteChannel(req.params.id, function(err, result) {
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

  function createChannel(req, res) {
    var members = [];

    if (req.body.members) {
      members = req.body.members.map(function(member) {
        return _.isString(member) ? member : member._id;
      });
    }

    if (members.indexOf(String(req.user._id)) === -1) {
      members.push(String(req.user._id));
    }

    var channel = {
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

    lib.channel.createChannel(channel, function(err, result) {
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

  function joinChannel(req, res) {
    lib.channel.addMemberToChannel(req.params.id, req.user._id, function(err) {
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

  function leaveChannel(req, res) {
    lib.channel.removeMemberFromChannel(req.params.id, req.user._id, function(err) {
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

  function findGroupByMembers(req, res) {
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

    lib.channel.findGroupByMembers(true, members, function(err, userGroups) {
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
    lib.channel.findGroupByMembers(false, [String(req.user._id)], function(err, usersGroups) {
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
    lib.channel.updateTopic(req.params.id, topic, function(err, channel) {
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
    getMessages: getMessages,
    getChannels: getChannels,
    getChannel: getChannel,
    findGroupByMembers: findGroupByMembers,
    findMyUsersGroups: findMyUsersGroups,
    getUserState: getUserState,
    setMyState: setMyState,
    joinChannel: joinChannel,
    leaveChannel: leaveChannel,
    deleteChannel: deleteChannel,
    createChannel: createChannel,
    updateTopic: updateTopic
  };
};
