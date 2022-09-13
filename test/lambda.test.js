'use strict';

/**
 * Buttress API -
 *
 * @file lambda.test.js
 * @description
 * @author Chris Bates-Keegan
 *
 */
const Sugar = require('sugar');

const Buttress = require('../lib/buttressjs');
const Config = require('./config');

Config.init();

const sleep = (time) => new Promise((r) => setTimeout(r, time));

const user = {
  policyProperties: {
    adminAccess: true,
  },
  app: 'google',
  id: '12345678987654321',
  username: 'Test User',
  token: 'thisisatestthisisatestthisisatestthisisatestthisisatest',
  email: 'test@test.com',
  profileUrl: 'http://test.com/thisisatest',
  profileImgUrl: 'http://test.com/thisisatest.png',
};

const authentication = {
  authLevel: 2,
  domains: [Config.endpoint],
  role: 'public',
  permissions: [
    {route: '*', permission: '*'},
  ],
};

const organisations = [{
  name: 'A&A CLEANING LTD LTD',
  number: '1',
  status: 'ACTIVE',
}, {
  name: 'B&ESM VISION LTD LTD',
  number: '2',
  status: 'DISSOLVED',
}, {
  name: 'C&H CARE SOLUTIONS LTD',
  number: '3',
  status: 'LIQUIDATION',
}];

describe('@lambda', function() {
  this.timeout(90000);
  let testUser = null;
  let testApp = null;

  before(async function() {
    Buttress.setAuthToken(Config.token);

    const existingApps = await Buttress.App.getAll();
    testApp = existingApps.find((a) => a.name === 'Lambda Test App');
    if (!testApp) {
      testApp = await Buttress.App.save({
        name: 'Lambda Test App',
        type: 'server',
        authLevel: 2,
        apiPath: 'lambda-test-app',
      });
    } else {
      // Fetch token and attach
      const tokens = await Buttress.Token.getAll();
      const appToken = tokens.find((t) => t.type === 'app' && t._app === testApp.id);
      if (!appToken) throw new Error('Found app but unable to find app token');
      testApp.token = appToken.value;
    }

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
    }];

    Buttress.setAuthToken(testApp.token);
    Buttress.setAPIPath('lambda-test-app');

    await Buttress.setSchema(schemas);

    await organisations.reduce(async (prev, next) => {
      await prev;
      await Buttress.getCollection('organisation').save(next);
    }, Promise.resolve());

    await sleep(1000);

    testUser = await Buttress.Auth.findOrCreateUser(user, authentication);
  });

  after(async function() {
    Buttress.setAuthToken(Config.token);

    await Buttress.User.remove(testUser.id);

    await Buttress.Token.removeAllUserTokens();
  });

  describe('Basic', function() {
    it('Should create a hello world lambda on the app', async function() {
      const lambda = {
        name: 'hello-world-lambda',
        git: {
          url: 'git@mahmoud-Aspire-XC-885:/home/mahmoud/hello-world.git',
          commitHash: 'dc5a5d18240a1c8633fe58c0f98351de7a7f1c67',
          rootPath: 'cron',
          projectPath: 'hello-world',
          codePath: 'hello-world.js',
          packagePath: 'package.json',
        },
        trigger: [{
          type: 'CRON',
          status: 'PENDING',
          periodicExecution: 'in 1 minutes',
          executionTime: Sugar.Date.create(),
        }],
        buttressConnection: {
          url: Config.endpoint,
          token: testApp.token,
          apiPath: testApp.apiPath,
          apiVersion: 1,
        }
      };

      const lambdaDB = await Buttress.Lambda.createLambda(lambda);
      lambdaDB.name.should.equal('hello-world-lambda');
    });

    it('Should create an edit organisation lambda on the app', async function() {
      const lambda = {
        name: 'organisation-edit-lambda',
        git: {
          url: 'git@mahmoud-Aspire-XC-885:/home/mahmoud/git-server/organisation-edit.git',
          commitHash: '3277e48dd71181b61f752492ab20ce0a159b4d21',
          rootPath: 'cron',
          projectPath: 'organisation-edit',
          codePath: 'organisation-edit.js',
        },
        trigger: [{
          type: 'CRON',
          status: 'PENDING',
          periodicExecution: 'in 1 day',
          executionTime: Sugar.Date.create(),
        }],
        buttressConnection: {
          url: Config.endpoint,
          token: testApp.token,
          apiPath: testApp.apiPath,
          apiVersion: 1,
        }
      };

      const lambdaDB = await Buttress.Lambda.createLambda(lambda);
      lambdaDB.name.should.equal('organisation-edit-lambda');
    });
  });
});