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
          url: 'git@mahmoud-Aspire-XC-885:/home/mahmoud/hello-world.git',
          branch: 'master',
          currentDeployment: '5f5f6fa4178eaf8740cfe924c8423c59a881adb6',
          rootPath: 'cron',
          projectPath: 'hello-world',
          entryPoint: 'hello-world.js',
        },
        buttressConnection: {
          url: Config.endpoint,
          token: testApp.token,
          apiPath: testApp.apiPath,
          apiVersion: 1,
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

    it('Should create an edit organisation lambda on the app', async function() {
      const lambda = {
        name: 'organisation-edit-lambda',
        git: {
          url: 'git@mahmoud-Aspire-XC-885:/home/mahmoud/git-server/organisation-edit.git',
          currentDeployment : '6708191a7fa86e2c73b5aa8229032f24bac37223',
          branch: 'master',
          rootPath: 'cron',
          projectPath: 'organisation-edit',
          entryPoint: 'organisation-edit.js',
          packagePath: 'package.json',
        },
        buttressConnection: {
          url: Config.endpoint,
          token: testApp.token,
          apiPath: testApp.apiPath,
          apiVersion: 1,
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

      // await sleep(5000);
      // const res = Buttress.getCollection('organisations').search({
      //   status: {
      //     $eq: 'ACTIVE',
      //   }
      // });
      // res.length.should.equal(2);
    });

    // it('Should create a get api endpoint lambda to get all organisation', async function() {
    //   const lambda = {
    //     name: 'api-get-organisation-lambda',
    //     git: {
    //       url: 'git@mahmoud-Aspire-XC-885:/home/mahmoud/git-server/api-get-organisation.git',
    //       branch: 'master',
    //       currentDeployment: '102a18861f5b92013bc57d2c9beb092bebd078e4',
    //       rootPath: 'routes',
    //       projectPath: 'api-get-organisation',
    //       entryPoint: 'index.js',
    //       packagePath: 'package.json',
    //     },
    //     trigger: [{
    //       type: 'API_ENDPOINT',
    //       status: 'PENDING',
    //       method: 'GET',
    //     }],
    //     buttressConnection: {
    //       url: Config.endpoint,
    //       token: testApp.token,
    //       apiPath: testApp.apiPath,
    //       apiVersion: 1,
    //     }
    //   };

    //   const lambdaDB = await Buttress.Lambda.createLambda(lambda);
    //   lambdaDB.name.should.equal('api-get-organisation-lambda');
    // });
  });
});