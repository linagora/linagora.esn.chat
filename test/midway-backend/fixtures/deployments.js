'use strict';

module.exports = {
  chatModule
};

function chatModule() {
  return {
    domain: {
      name: 'linagora',
      hostnames: [
        'localhost',
        '127.0.0.1'
      ],
      company_name: 'linagora'
    },
    users: [
      {
        password: 'secret',
        firstname: 'Domain ',
        lastname: 'Administrator',
        accounts: [{
          type: 'email',
          hosted: true,
          emails: ['itadmin@lng.net']
        }]
      },
      {
        password: 'secret',
        firstname: 'Eric',
        lastname: 'Norris',
        accounts: [{
          type: 'email',
          hosted: true,
          emails: ['eric@lng.net']
        }]
      },
      {
        password: 'secret',
        firstname: 'clint',
        lastname: 'eastwood',
        accounts: [{
          type: 'email',
          hosted: true,
          emails: ['clint@lng.net']
        }]
      }
    ]
  };
}
