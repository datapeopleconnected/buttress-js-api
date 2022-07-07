'use strict';

/**
 * Buttress API -
 *
 * @file app.test.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const io = require('socket.io-client');
const socketUrl = 'http://localhost:6073';
const Buttress = require('../lib/buttressjs');
const Config = require('./config');

Config.init();

const sleep = (time) => new Promise((r) => setTimeout(r, time));

const users = [{
  policyProperties: {
    adminAccess: true,
  },
  app: 'google',
  id: '12345678987654321',
  username: 'Test User 1',
  token: 'thisisatestthisisatestthisisatestthisisatestthisisatest',
  email: 'test@test.com',
  profileUrl: 'http://test.com/thisisatest',
  profileImgUrl: 'http://test.com/thisisatest.png',
}, {
  policyProperties: {
    grade: 1,
  },
  app: 'google',
  id: '12345678987654322',
  username: 'Test User 2',
  token: 'thisisatestthisisatestthisisatestthisisatestthisisatest',
  email: 'test@test.com',
  profileUrl: 'http://test.com/thisisatest',
  profileImgUrl: 'http://test.com/thisisatest.png',
}, {
  policyProperties: {
    grade: 2,
  },
  app: 'google',
  id: '12345678987654323',
  username: 'Test User 3',
  token: 'thisisatestthisisatestthisisatestthisisatestthisisatest',
  email: 'test@test.com',
  profileUrl: 'http://test.com/thisisatest',
  profileImgUrl: 'http://test.com/thisisatest.png',
}, {
  policyProperties: {
    grade: 3,
    securityClearance: 1,
  },
  app: 'google',
  id: '12345678987654324',
  username: 'Test User 4',
  token: 'thisisatestthisisatestthisisatestthisisatestthisisatest',
  email: 'test@test.com',
  profileUrl: 'http://test.com/thisisatest',
  profileImgUrl: 'http://test.com/thisisatest.png',
}];

const authentication = {
  authLevel: 2,
  domains: [Config.endpoint],
  role: 'public',
  permissions: [
    {route: '*', permission: '*'},
  ],
};

const policies = [{
  name: 'admin-access',
  selection: {
    adminAccess: {
      '@eq': true,
    },
  },
  config: [{
    endpoints: ['GET', 'SEARCH', 'PUT', 'POST', 'DELETE'],
  }],
}, {
  name: 'working-date',
  selection: {
    grade: {
      '@eq': 1,
    },
  },
  config: [{
    endpoints: ['GET'],
    env: {
      startDate: '01/01/2022',
      endDate: '31/01/2023',
      date: 'now',
    },
    conditions: [{
      'schema': ['organisation'],
      '@and': [{
        date: {
          '@env.date': {
            '@gtDate': 'env.startDate',
          },
        },
      }, {
        date: {
          '@env.date': {
            '@ltDate': 'env.endDate',
          },
        },
      }],
    }],
  }],
}, {
  name: 'active-organisations',
  selection: {
    grade: {
      '@eq': 2,
    },
  },
  config: [{
    endpoints: ['GET'],
    query: [{
      schema: ['organisation'],
      status: {
        '@eq': 'ACTIVE',
      },
    }],
  }],
}, {
  name: 'box-height',
  selection: {
    grade: {
      '@eq': 3,
    },
  },
  config: [{
    endpoints: ['GET'],
    projection: [{
      schema: ['box'],
      keys: ['height'],
    }],
  }],
}, {
  name: 'client',
  selection: {
    securityClearance: {
      '@eq': 1,
    },
  },
  config: [{
    endpoints: ['GET'],
    query: [{
      schema: ['client'],
    }],
  }],
}];

describe('@socket', function() {
  this.timeout(90000);

  const testPolicies = [];
  const testUsers = [];
  let testApp = null;

  const schemas = [{
    'name': 'organisation',
    'type': 'collection',
    'properties': {
      'name': {
        '__type': 'string',
        '__default': null,
        '__required': true,
        '__allowUpdate': true
      },
      'number': {
        '__type': 'string',
        '__default': null,
        '__required': true,
        '__allowUpdate': true
      },
      'status': {
        '__type': 'string',
        '__default': null,
        '__required': true,
        '__allowUpdate': true
      }
    }
  }, {
    'name': 'client',
    'type': 'collection',
    'properties': {
      'name': {
        '__type': 'string',
        '__default': null,
        '__required': true,
        '__allowUpdate': true
      },
      'email': {
        '__type': 'string',
        '__default': null,
        '__required': true,
        '__allowUpdate': true
      },
      'phone': {
        '__type': 'string',
        '__default': null,
        '__required': true,
        '__allowUpdate': true
      }
    }
  }, {
    'name': 'box',
    'type': 'collection',
    'properties': {
      'height': {
        '__type': 'string',
        '__default': null,
        '__required': true,
        '__allowUpdate': true
      },
      'width': {
        '__type': 'string',
        '__default': null,
        '__required': true,
        '__allowUpdate': true
      },
      'depth': {
        '__type': 'string',
        '__default': null,
        '__required': true,
        '__allowUpdate': true
      }
    }
  }];

  before(async function() {
    Buttress.setAuthToken(Config.token);

    const existingApps = await Buttress.App.getAll();
    testApp = existingApps.find((a) => a.name === 'Socket Test App');
    if (!testApp) {
      testApp = await Buttress.App.save({
        name: 'Socket Test App',
        type: 'server',
        authLevel: 2,
        apiPath: 'socket-test-app',
      });
    } else {
      // Fetch token and attach
      const tokens = await Buttress.Token.getAll();
      const appToken = tokens.find((t) => t.type === 'app' && t._app === testApp.id);
      if (!appToken) throw new Error('Found app but unable to find app token');
      testApp.token = appToken.value;
    }

    Buttress.setAuthToken(testApp.token);
    Buttress.setAPIPath('socket-test-app');

    await Buttress.setRoles({
      'default': 'public',
      'roles': [
        {
          'name': 'public',
          'endpointDisposition': 'allowAll',
          'dataDisposition': 'allowAll'
        }
      ]
    });

    await Buttress.setSchema(schemas);

    await sleep(100);

    await policies.reduce(async (prev, next) => {
      await prev;
      testPolicies.push(await Buttress.Policy.createPolicy(next));
    }, Promise.resolve());

    await users.reduce(async (prev, user) => {
      await prev;
      testUsers.push(await Buttress.Auth.findOrCreateUser(user, authentication));
    }, Promise.resolve());
  });

  after(async function() {
    Buttress.setAuthToken(Config.token);

    await testUsers.reduce(async (prev, user) => {
      await prev;
      await Buttress.User.remove(user.id);
    }, Promise.resolve());

    await testPolicies.reduce(async (prev, next) => {
      await prev;
      await Buttress.Policy.remove(next.id);
    }, Promise.resolve());

    await Buttress.Token.removeAllUserTokens();
  });

  it('should create a socket room for admin policy', async() => {
    const user1 = testUsers.find((u) => u.auth[0].username === 'Test User 1');
    const userToken = user1.tokens[0].value;
    const socket = io.connect(`${socketUrl}/socket-test-app`, {query: `token=${userToken}`});
    // add a promise to resolve with socket is connected
    await new Promise((resolve) => {
      socket.on('connect', () => {
        resolve();
      });
    });

    socket.disconnect();
  });

  it('should create a socket room for a policy that gives full access to organisation', async() => {
    const user2 = testUsers.find((u) => u.auth[0].username === 'Test User 2');
    const userToken = user2.tokens[0].value;
    const socket = io.connect(`${socketUrl}/socket-test-app`, {query: `token=${userToken}`});
    // add a promise to resolve with socket is connected
    await new Promise((resolve) => {
      socket.on('connect', () => {
        resolve();
      });
    });

    socket.disconnect();
  });

  it('should create a socket room for a policy that gives access to organisation with a filter', async() => {
    const user3 = testUsers.find((u) => u.auth[0].username === 'Test User 3');
    const userToken = user3.tokens[0].value;
    const socket = io.connect(`${socketUrl}/socket-test-app`, {query: `token=${userToken}`});
    // add a promise to resolve with socket is connected
    await new Promise((resolve) => {
      socket.on('connect', () => {
        resolve();
      });
    });

    socket.disconnect();
  });

  it(`should create a socket room for a policy that gives access to box's height`, async() => {
    const user4 = testUsers.find((u) => u.auth[0].username === 'Test User 4');
    const userToken = user4.tokens[0].value;
    const socket = io.connect(`${socketUrl}/socket-test-app`, {query: `token=${userToken}`});
    // add a promise to resolve with socket is connected
    await new Promise((resolve) => {
      socket.on('connect', () => {
        resolve();
      });
    });

    socket.disconnect();
  });
});
