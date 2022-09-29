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
const fetch = require('cross-fetch');

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

const allowList = [{
  packageName: '@buttress/api',
  packageVersion: '^3.0.0-12',
}, {
  packageName: 'passport',
  packageVersion: '^0.6.0',
}];

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
    await Buttress.App.setAllowList(allowList);
    await Buttress.App.updateAllowList([{
      packageName: 'passport-google-oauth20',
      packageVersion: '^2.0.0',
    }]);

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
          url: 'ssh://git@git.wearelighten.co.uk:8822/lambdas/hello-world.git',
          branch: 'main',
          currentDeployment: '54f2fd5f0c0e889881f0a2af40f9d69240b47b6b',
          entryPoint: 'hello-world.js',
        },
        trigger: [{
          type: 'CRON',
          status: 'PENDING',
          periodicExecution: 'in 1 minutes',
          executionTime: Sugar.Date.create(),
        }],
      };

      const lambdaDB = await Buttress.Lambda.createLambda(lambda);

      lambdaDB.name.should.equal('hello-world-lambda');
    });

    it('Should fail to create a deployment hash that does not exist on develop branch', async function() {
      const [lambda] = await Buttress.Lambda.search({
        name: {
          $eq: 'hello-world-lambda',
        }
      });

      try {
        await Buttress.Lambda.editLambdaDeployment(lambda.id, {
          hash: '54f2fd5f0c0e889881f0a2af40f9d69240b47b6b',
          branch: 'develop'
        });
      } catch (err) {
        err.statusCode.should.equal(400);
        return;
      }

      throw new Error('it did not fail');
    });

    it('Should create an edit organisation lambda on the app', async function() {
      const lambda = {
        name: 'organisation-edit-lambda',
        git: {
          url: 'git@mahmoud-Aspire-XC-885:/home/mahmoud/git-server/organisation-edit.git',
          currentDeployment : '6708191a7fa86e2c73b5aa8229032f24bac37223',
          branch: 'master',
          entryPoint: 'organisation-edit.js',
        },
        trigger: [{
          type: 'CRON',
          status: 'PENDING',
          periodicExecution: 'in 1 day',
          executionTime: Sugar.Date.create(),
        }],
      };

      const lambdaDB = await Buttress.Lambda.createLambda(lambda);
      lambdaDB.name.should.equal('organisation-edit-lambda');
    });

    it('Should create a get api endpoint lambda to print hello world', async function() {
      const lambda = {
        name: 'api-hello-world-lambda',
        git: {
          url: 'ssh://git@git.wearelighten.co.uk:8822/lambdas/api-hello-world.git',
          branch: 'main',
          currentDeployment: 'e3470ca8155baa51583f4b55ae27b6e209efbebd',
          entryPoint: 'index.js',
        },
        trigger: [{
          type: 'API_ENDPOINT',
          status: 'API_CALL',
          method: 'GET',
        }],
      };

      const lambdaDB = await Buttress.Lambda.createLambda(lambda);
      lambdaDB.name.should.equal('api-hello-world-lambda');

      // await fetch(`${Config.endpoint}/api/v1/lambda/6335c632c9485079247b5217`, {
      //   method: 'GET',
      // });
    });

    it('Should create a get api endpoint lambda to edit all dissolved organisation to active', async function() {
      const lambda = {
        name: 'api-edit-organisation-lambda',
        git: {
          url: 'git@mahmoud-Aspire-XC-885:/home/mahmoud/git-server/api-edit-organisation.git',
          branch: 'master',
          currentDeployment: '866f98267125ad79c1dbe46495a8fdeca94ced03',
          entryPoint: 'index.js',
        },
        trigger: [{
          type: 'API_ENDPOINT',
          status: 'API_CALL',
          method: 'GET',
        }],
      };

      const lambdaDB = await Buttress.Lambda.createLambda(lambda);
      lambdaDB.name.should.equal('api-edit-organisation-lambda');

      const res = await fetch(`${Config.endpoint}/api/v1/lambda/${lambdaDB.id}`, {
        method: 'GET',
      });
      const executionId = await res.json();

      const statusRes = await fetch(`${Config.endpoint}/api/v1/lambda/status/${executionId}`, {
        method: 'GET',
      });
      const resJson = await statusRes.json();
      const status = resJson?.status;
      const outcome = status === 'PENDING' || status === 'RUNNING' || status === 'COMPLETE';

      outcome.should.equal(true);
    });
  });
});