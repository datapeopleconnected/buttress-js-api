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

const authentication = {
  authLevel: 2,
  domains: [Config.endpoint],
  permissions: [
    {route: '*', permission: '*'},
  ],
};

const policies = [{
  name: 'admin-lambda',
  selection: {
    adminAccess: {
      '@eq': true,
    },
  },
  config: [{
    endpoints: ['GET', 'SEARCH', 'PUT', 'POST', 'DELETE'],
    query: [{
      schema: ['ALL'],
      access: 'FULL_ACCESS',
    }],
  }],
}, {
  name: 'active-org-lambda',
  selection: {
    grade: {
      '@eq': 1,
    },
  },
  config: [{
    endpoints: ['GET', 'SEARCH', 'PUT', 'POST', 'DELETE'],
    query: [{
      schema: ['organisation'],
      status: {
        '@eq': 'ACTIVE',
      },
    }],
  }],
}];

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
  empolyees: ['John Doe'],
}, {
  name: 'B&ESM VISION LTD LTD',
  number: '2',
  status: 'DISSOLVED',
  empolyees: ['John Doe'],
}, {
  name: 'C&H CARE SOLUTIONS LTD',
  number: '3',
  status: 'LIQUIDATION',
  empolyees: ['John Doe'],
}, {
  name: 'LIGHTEN',
  number: '4',
  status: 'ACTIVE',
  empolyees: ['John Doe'],
}];

describe('@lambda', function() {
  this.timeout(90000);
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
        },
        'empolyees': {
          '__type': 'array',
          '__itemtype': 'string',
          '__required': true,
          '__allowUpdate': true,
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
  });

  after(async function() {
    Buttress.setAuthToken(Config.token);

    await Buttress.Token.removeAllUserTokens();
  });

  describe('Basic', function() {
    it('Should create policies on the app', async function() {
      const appPolicies = [];
      await policies.reduce(async (prev, next) => {
        await prev;
        appPolicies.push(await Buttress.Policy.createPolicy(next));
      }, Promise.resolve());

      appPolicies.length.should.equal(2);
    });

    // it('Should create a hello world lambda on the app', async function() {
    //   const lambda = {
    //     name: 'hello-world-lambda',
    //     git: {
    //       url: 'ssh://git@git.wearelighten.co.uk:8822/lambdas/hello-world.git',
    //       branch: 'main',
    //       currentDeployment: '54f2fd5f0c0e889881f0a2af40f9d69240b47b6b',
    //       entryPoint: 'hello-world.js',
    //     },
    //     trigger: [{
    //       type: 'CRON',
    //       cron: {
    //         status: 'PENDING',
    //         periodicExecution: 'in 1 minutes',
    //         executionTime: Sugar.Date.create(),
    //       }
    //     }],
    //     policyProperties: {
    //       adminAccess: true,
    //     }
    //   };

    //   const lambdaDB = await Buttress.Lambda.createLambda(lambda, authentication);

    //   lambdaDB.name.should.equal('hello-world-lambda');
    // });

    // it('Should fail to create a deployment hash that does not exist on develop branch', async function() {
    //   const [lambda] = await Buttress.Lambda.search({
    //     name: {
    //       $eq: 'hello-world-lambda',
    //     }
    //   });

    //   try {
    //     await Buttress.Lambda.editLambdaDeployment(lambda.id, {
    //       hash: '554148cea01ed2517a3302b806202f23ce10dc17',
    //       branch: 'develop'
    //     });
    //   } catch (err) {
    //     err.statusCode.should.equal(400);
    //     return;
    //   }

    //   throw new Error('it did not fail');
    // });

    // it('Should create an edit organisation lambda on the app', async function() {
    //   const lambda = {
    //     name: 'organisation-edit-lambda',
    //     git: {
    //       url: 'ssh://git@git.wearelighten.co.uk:8822/lambdas/edit-data.git',
    //       currentDeployment : 'b2f6d22287e05e2ac5a63d591cd6b88aa0ee1ce5',
    //       branch: 'main',
    //       entryPoint: 'organisation-edit.js',
    //     },
    //     trigger: [{
    //       type: 'CRON',
    //       cron: {
    //         status: 'PENDING',
    //         periodicExecution: 'in 1 day',
    //         executionTime: Sugar.Date.create(),
    //       }
    //     }],
    //     policyProperties: {
    //       adminAccess: true,
    //     }
    //   };

    //   const lambdaDB = await Buttress.Lambda.createLambda(lambda, authentication);
    //   lambdaDB.name.should.equal('organisation-edit-lambda');
    // });

    it('Should create a get api endpoint lambda to print hello world', async function() {
      const lambda = {
        name: 'api-hello-world-lambda',
        git: {
          url: 'ssh://git@git.wearelighten.co.uk:8822/lambdas/api-hello-world.git',
          branch: 'main',
          currentDeployment: '521b706a91af967d52fb93533e68501492b22210',
          entryPoint: 'index.js',
        },
        trigger: [{
          type: 'API_ENDPOINT',
          api: {
            method: 'GET',
          }
        }],
        policyProperties: {
          adminAccess: true,
        }
      };

      const lambdaDB = await Buttress.Lambda.createLambda(lambda, authentication);
      lambdaDB.name.should.equal('api-hello-world-lambda');

      await fetch(`${Config.endpoint}/api/v1/lambda/${lambdaDB.id}`, {
        method: 'GET',
      });
    });

    // it('Should create a get api endpoint lambda to edit all dissolved organisation to active', async function() {
    //   const lambda = {
    //     name: 'api-edit-organisation-lambda',
    //     git: {
    //       url: 'ssh://git@git.wearelighten.co.uk:8822/lambdas/api-edit-data.git',
    //       branch: 'main',
    //       currentDeployment: '5809366f4d5e9922474b639b7961087e10283649',
    //       entryPoint: 'index.js',
    //     },
    //     trigger: [{
    //       type: 'API_ENDPOINT',
    //       api: {
    //         method: 'GET',
    //       }
    //     }],
    //     policyProperties: {
    //       adminAccess: true,
    //     }
    //   };

    //   const lambdaDB = await Buttress.Lambda.createLambda(lambda, authentication);  
    //   lambdaDB.name.should.equal('api-edit-organisation-lambda');
    // });

    // it('Should call the api-edit-organisation-lambda lambda to edit all dissolved organisation to active', async function() {
    //   const [lambda] = await Buttress.Lambda.search({
    //     name: {
    //       $eq: 'api-edit-organisation-lambda',
    //     }
    //   });
    //   const res = await fetch(`${Config.endpoint}/api/v1/lambda/${lambda.id}`, {
    //     method: 'GET',
    //   });
    //   const executionId = await res.json();
    //   await sleep(1000);

    //   const statusRes = await fetch(`${Config.endpoint}/api/v1/lambda/status/${executionId}`, {
    //     method: 'GET',
    //   });
    //   const resJson = await statusRes.json();
    //   const status = resJson?.status;

    //   const companies = await Buttress.getCollection('organisation').search({
    //     status: {
    //       $eq: 'ACTIVE',
    //     },
    //   });

    //   companies.length.should.equal(3);
    //   status.should.equal('COMPLETE');
    // });

    // it('Should fail executing a lambda that does not have the required access control policy', async function() {
    //   const [lambda] = await Buttress.Lambda.search({
    //     name: {
    //       $eq: 'api-edit-organisation-lambda',
    //     }
    //   });

    //   await Buttress.Lambda.setPolicyProperty(lambda.id, {
    //     grade: 1,
    //   });

    //   const res = await fetch(`${Config.endpoint}/api/v1/lambda/${lambda.id}`, {
    //     method: 'GET',
    //   });
    //   const executionId = await res.json();
    //   await sleep(1000);

    //   const statusRes = await fetch(`${Config.endpoint}/api/v1/lambda/status/${executionId}`, {
    //     method: 'GET',
    //   });
    //   const resJson = await statusRes.json();
    //   const status = resJson?.status;
    //   status.should.equal('ERROR');
    // });

    // it('Should create a post api endpoint lambda for adding organisations', async function() {
    //   const lambda = {
    //     name: 'api-add-organisation-lambda',
    //     git: {
    //       url: 'ssh://git@git.wearelighten.co.uk:8822/lambdas/api-add-data.git',
    //       branch: 'main',
    //       currentDeployment: 'c98f5aa377d5540673ea47598267f97b9fda28cb',
    //       entryPoint: 'index.js',
    //     },
    //     trigger: [{
    //       type: 'API_ENDPOINT',
    //       api: {
    //         method: 'POST',
    //       }
    //     }],
    //     policyProperties: {
    //       adminAccess: true,
    //     }
    //   };

    //   const lambdaDB = await Buttress.Lambda.createLambda(lambda, authentication);
    //   lambdaDB.name.should.equal('api-add-organisation-lambda');
    // });

    // it('Should call API add organisation lambda to add an organisation', async function() {
    //   const organisation = {
    //     status: 'ACTIVE',
    //     name: 'Data Performance Consultancy',
    //     number: 10,
    //     empolyees: ['John', 'Joe', 'Robert'],
    //   }
    //   const [lambda] = await Buttress.Lambda.search({
    //     name: {
    //       $eq: 'api-add-organisation-lambda',
    //     }
    //   });

    //   const res = await fetch(`${Config.endpoint}/api/v1/lambda/${lambda.id}`, {
    //     method: 'POST',
    //     body: JSON.stringify(organisation),
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'Content-Length': (JSON.stringify(organisation).length),
    //     },
    //   });

    //   const executionId = await res.json();

    //   if (typeof executionId !== 'string') {
    //     throw new Error('failed to make the API call');
    //   }

    //   await sleep(1000);

    //   const statusRes = await fetch(`${Config.endpoint}/api/v1/lambda/status/${executionId}`, {
    //     method: 'GET',
    //   });
    //   const resJson = await statusRes.json();
    //   const status = resJson?.status;

    //   const companies = await Buttress.getCollection('organisation').search({
    //     name: {
    //       $eq: 'Data Performance Consultancy',
    //     },
    //   });

    //   companies.length.should.equal(1);
    //   status.should.equal('COMPLETE');
    // });

    // it('Should create a name path mutation lambda and use the cr to change organisation name', async function() {
    //   const lambda = {
    //     name: 'name-path-lambda',
    //     git: {
    //       url: 'ssh://git@git.wearelighten.co.uk:8822/lambdas/name-path-mutation.git',
    //       currentDeployment : '57defc4f4e15d46fae2927b3dd7adeb573d38714',
    //       branch: 'main',
    //       entryPoint: 'index.js',
    //     },
    //     trigger: [{
    //       type: 'PATH_MUTATION',
    //       pathMutation: {
    //         paths: ['organisation.*.name', 'organisation.*.empolyees', 'organisation.empolyees.1'],
    //       }
    //     }],
    //     policyProperties: {
    //       adminAccess: true,
    //     }
    //   };

    //   const lambdaDB = await Buttress.Lambda.createLambda(lambda, authentication);

    //   await sleep(1000);

    //   const [organisation] = await Buttress.getCollection('organisation').search({
    //     name: {
    //       $eq: 'LIGHTEN'
    //     },
    //   });

    //   await Buttress.getCollection('organisation').update(organisation.id, [{
    //     path: 'name',
    //     value: 'DPC LTD'
    //   }]);

    //   await sleep(1000);
    //   const [testLambdaPathOrg] = await Buttress.getCollection('organisation').search({
    //     name: {
    //       $eq: 'Test Lambda Path Mutation',
    //     }
    //   });

    //   await Buttress.getCollection('organisation').update(testLambdaPathOrg.id, [{
    //     path: 'name',
    //     value: 'Lighten'
    //   }]);

    //   await sleep(1000);
    //   const testOrg = await Buttress.getCollection('organisation').search({
    //     name: {
    //       $eq: 'Test Lambda Path Mutation',
    //     }
    //   });

    //   lambdaDB.name.should.equal('name-path-lambda');
    //   testLambdaPathOrg.name.should.equal('Test Lambda Path Mutation');
    //   testOrg.length.should.equal(0);
    // });
  });
});