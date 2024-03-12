'use strict';

/**
 * Buttress API -
 *
 * @file advanced-policy.test.js
 * @description
 * @author Chris Bates-Keegan
 *
 */
const Buttress = require('../lib/buttressjs');
const Config = require('./config');

Config.init();

const sleep = (time) => new Promise((r) => setTimeout(r, time));

const users = [{
  policyProperties: {
    team: 'director',
  },
  app: 'google',
  appId: '123',
  username: 'Director',
  token: 'thisisatestthisisatestthisisatestthisisatestthisisatest',
  email: 'test@test.com',
  profileUrl: 'http://test.com/thisisatest',
  profileImgUrl: 'http://test.com/thisisatest.png',
}, {
  policyProperties: {
    team: 'employee',
  },
  app: 'google',
  appId: '456',
  username: 'Bob',
  token: 'thisisatestthisisatestthisisatestthisisatestthisisatest',
  email: 'bob@test.com',
  profileUrl: 'http://test.com/thisisatest',
  profileImgUrl: 'http://test.com/thisisatest.png',
}, {
  policyProperties: {
    team: 'employee',
  },
  app: 'google',
  appId: '789',
  username: 'John',
  token: 'thisisatestthisisatestthisisatestthisisatestthisisatest',
  email: 'john@test.com',
  profileUrl: 'http://test.com/thisisatest',
  profileImgUrl: 'http://test.com/thisisatest.png',
}, {
  policyProperties: {
    team: 'employee',
  },
  app: 'google',
  appId: '012',
  username: 'Dave',
  token: 'thisisatestthisisatestthisisatestthisisatestthisisatest',
  email: 'dave@test.com',
  profileUrl: 'http://test.com/thisisatest',
  profileImgUrl: 'http://test.com/thisisatest.png',
}];

const authentication = {
  domains: [Config.endpoint],
  role: 'public',
  permissions: [
    {route: '*', permission: '*'},
  ],
};

const policies = [{
  name: 'validated-company-access',
  selection: {
    team: {
      '@eq': 'director',
    },
  },
  config: [{
    endpoints: ['SEARCH', 'GET'],
    env: {
      companiesIds: {
        collection: 'employee',
        type: 'array',
        query: {
          userId: {
            $eq: 'user.id',
          },
        },
        output: {
          key: 'companies',
          type: 'id'
        },
      },
      validCompaniesIds: {
        collection: 'company',
        type: 'array',
        query: {
          _id: {
            $in: 'env.companiesIds',
          },
          valid: {
            $eq: true,
          },
        },
        output: {
          key: 'id',
          type: 'id',
        },
      },
    },
    query: [{
      schema: ['employee'],
      companies: {
        '@in': 'env.validCompaniesIds'
      },
    }],
  }],
}, {
  name: 'workflow-access',
  selection: {
    team: {
      '@eq': 'employee',
    },
  },
  config: [{
    endpoints: ['GET', 'SEARCH'],
    env: {
      myId: {
        collection: 'employee',
        type: 'id',
        query: {
          userId: {
            $eq: 'user.id',
          },
        },
        output: {
          key: 'id',
          type: 'id',
        },
      },
      companiesIds: {
        collection: 'employee',
        type: 'array',
        query: {
          userId: {
            $eq: 'user.id',
          },
        },
        output: {
          key: 'companies',
          type: 'id'
        },
      },
    },
    query: [{
      schema: ['workflow'],
      companies: {
        '@in': 'env.companiesIds',
      },
      participants: {
        '@eq': 'env.myId',
      },
    }],
  }],
}];

const companies = [{
  name: 'Lighten',
  active: true,
  valid: true,
}, {
  name: 'DPC',
  active: false,
  valid: true,
}, {
  name: 'nodeStream',
  active: true,
  valid: false,
}, {
  name: 'Data People Connected',
  active: false,
  valid: false,
}];

const workflows = [{
  name: 'Verify Order',
  status: 'PENDING',
  companies: [],
  participants: [],
}, {
  name: 'Custoemr Service',
  status: 'PENDING',
  companies: [],
  participants: [],
}, {
  name: 'Cancel Order',
  status: 'PENDING',
  companies: [],
  participants: [],
}]

describe('@advanced-policy', function() {
    this.timeout(90000);

    const testCompanies = [];
    const testPolicies = [];
    const testUsers = [];
    const testEmployees = []
    let testApp = null;

    const schemas = [{
      'name': 'company',
      'type': 'collection',
      'properties': {
        'name': {
          '__type': 'string',
          '__default': null,
          '__required': true,
          '__allowUpdate': true
        },
        'active': {
          '__type': 'boolean',
          '__default': false,
          '__required': true,
          '__allowUpdate': true
        },
        'valid': {
          '__type': 'boolean',
          '__default': false,
          '__required': true,
          '__allowUpdate': true
        },
        'employee': {
          '__type': 'array',
          '__itemtype': 'string',
          '__required': false,
          '__allowUpdate': true
        },
      }
    }, {
      'name': 'employee',
      'type': 'collection',
      'properties': {
        'userId': {
          '__type': 'id',
          '__default': null,
          '__required': true,
          '__allowUpdate': false,
        },
        'name': {
          '__type': 'string',
          '__default': null,
          '__required': true,
          '__allowUpdate': true
        },
        'age': {
          '__type': 'number',
          '__default': null,
          '__required': true,
          '__allowUpdate': true
        },
        'companies': {
          '__type': 'array',
          '__itemtype': 'id',
          '__required': true,
          '__allowUpdate': true
        },
      },
    }, {
      'name': 'workflow',
      'type': 'collection',
      'properties': {
        'name': {
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
        'participants': {
          '__type': 'array',
          '__itemtype': 'id',
          '__required': true,
          '__allowUpdate': true
        },
        'companies': {
          '__type': 'array',
          '__itemtype': 'id',
          '__required': true,
          '__allowUpdate': true
        },
      },
    }];

    before(async function() {
      Buttress.setAuthToken(Config.token);

      const existingApps = await Buttress.getCollection('app').getAll();
      testApp = existingApps.find((a) => a.name === 'Test App');
      if (!testApp) {
        testApp = await Buttress.getCollection('app').save({
          name: 'Test App',
          type: 'app',
          apiPath: 'test-app',
        });
      } else {
        // Fetch token and attach
        const tokens = await Buttress.getCollection('token').getAll();
        const appToken = tokens.find((t) => t.type === 'app' && t._appId === testApp.id);
        if (!appToken) throw new Error('Found app but unable to find app token');
        testApp.token = appToken.value;
      }

      Buttress.setAuthToken(testApp.token);
      Buttress.setAPIPath('test-app');

      await Buttress.setSchema(schemas);

      await sleep(1000);

      await Buttress.getCollection('app').setPolicyPropertyList({team: ['director', 'employee']});

      for await (const company of companies) {
        testCompanies.push(await Buttress.getCollection('company').save(company));
      }

      const lightenCompany = testCompanies.find((c) => c.name === 'Lighten');
      for await (const userObj of users) {
        authentication.policyProperties = userObj.policyProperties;
        const user = await Buttress.getCollection('auth').findOrCreateUser(userObj, authentication);
        const employee = await Buttress.getCollection('employee').save({
          userId: user.id,
          name: userObj.username,
          age: Math.floor(Math.random() * (50 - 25 + 1)) + 25,
          companies: (userObj.username.toUpperCase() === 'DIRECTOR') ? testCompanies.map((c) => c.id) : [lightenCompany.id],
        });
        await Buttress.getCollection('company').update(lightenCompany.id, [{
          path: 'employee',
          value: employee.id,
        }]);
        testEmployees.push(employee);
        testUsers.push(user);
      }

      const bob = testEmployees.find((em) => em.name === 'Bob');
      console.log('assign all workflow to Lighten and Bob');
      for await (const workflow of workflows) {
        workflow.companies = [lightenCompany.id];
        workflow.participants = [bob.id];
        await Buttress.getCollection('workflow').save(workflow);
      }
    });

    after(async function() {
      Buttress.setAuthToken(Config.token);

      for await (const policy of testPolicies) {
        await Buttress.getCollection('policy').remove(policy.id);
      }

      await Buttress.getCollection('user').removeAll();
      await Buttress.getCollection('company').removeAll();
      await Buttress.getCollection('employee').removeAll();
      await Buttress.getCollection('workflow').removeAll();
      await Buttress.getCollection('token').removeAllUserTokens();
    });

    describe('Basic', function() {
      it('Should create policies on the app', async function() {
        for await (const policy of policies) {
          testPolicies.push(await Buttress.getCollection('policy').createPolicy(policy));
        }

        testPolicies.length.should.equal(2);
      });

      it('Director should access all 4 employees in his valid companies using admin access policy', async function() {
        const director = testUsers.find((user) => user.auth.find((au) => au.username === 'Director'));
        Buttress.setAuthToken(director.tokens[0].value);

        const res = await Buttress.getCollection('employee').getAll();
        res.length.should.equal(4);
      });

      it('Should change user Dave and John companies using superToken from Lighten to DPC both validated companies', async function() {
        Buttress.setAuthToken(Config.token);
        const daveAndJohn = testEmployees.filter((em) => em.name === 'Dave' || em.name === 'John');
        const dpc = testCompanies.find((c) => c.name === 'DPC');
        for await (const employee of daveAndJohn) {
          await Buttress.getCollection('employee').update(employee.id, [{
            path: 'companies.0.__remove__',
            value: '',
          }, {
            path: 'companies',
            value: dpc.id,
          }]);
        }
      });

      it('Director should access all 4 employees in his validated companies using admin access policy', async function() {
        const director = testUsers.find((user) => user.auth.find((au) => au.username === 'Director'));
        Buttress.setAuthToken(director.tokens[0].value);

        const res = await Buttress.getCollection('employee').getAll();
        res.length.should.equal(4);
      });

    it('Should change user Dave and John companies using superToken from DPC to nodeStream which is not a validated company', async function() {
      Buttress.setAuthToken(Config.token);
      const daveAndJohn = testEmployees.filter((em) => em.name === 'Dave' || em.name === 'John');
      const nodeStream = testCompanies.find((c) => c.name === 'nodeStream');
      for await (const employee of daveAndJohn) {
        await Buttress.getCollection('employee').update(employee.id, [{
          path: 'companies.0.__remove__',
          value: '',
        }, {
          path: 'companies',
          value: nodeStream.id,
        }]);
      }
    });

    it('Director should only access have access to 2 employees in his validated companies using admin access policy', async function() {
      const director = testUsers.find((user) => user.auth.find((au) => au.username === 'Director'));
      Buttress.setAuthToken(director.tokens[0].value);

      const res = await Buttress.getCollection('employee').getAll();
      res.length.should.equal(2);
    });

    it('Should change all users companies using superToken from nodeStream to People Data Connected which is not a validated company', async function() {
      Buttress.setAuthToken(Config.token);
      const daveAndJohn = testEmployees.filter((em) => em.name === 'Dave' || em.name === 'John' || em.name === 'Bob');
      const dataPeopleConnected = testCompanies.find((c) => c.name === 'Data People Connected');
      for await (const employee of daveAndJohn) {
        await Buttress.getCollection('employee').update(employee.id, [{
          path: 'companies.0.__remove__',
          value: '',
        }, {
          path: 'companies',
          value: dataPeopleConnected.id,
        }]);
      }
    });

    it('Director should only access his user as it is the only user with a validated company using admin access policy', async function() {
      const director = testUsers.find((user) => user.auth.find((au) => au.username === 'Director'));
      Buttress.setAuthToken(director.tokens[0].value);

      const res = await Buttress.getCollection('employee').getAll();
      res.length.should.equal(1);
    });

    it('Should change Bob to be part of lighten', async function() {
      Buttress.setAuthToken(Config.token);
      const bob = testEmployees.find((em) => em.name === 'Bob');
      const lighten = testCompanies.find((c) => c.name === 'Lighten');
      await Buttress.getCollection('employee').update(bob.id, [{
        path: 'companies.0.__remove__',
        value: '',
      }, {
        path: 'companies',
        value: lighten.id,
      }]);
    });

    it('Bob Should have access to 3 workflows', async function() {
      const bob = testUsers.find((user) => user.auth.find((au) => au.username === 'Bob'));
      Buttress.setAuthToken(bob.tokens[0].value);
      const bobWorkflows = await Buttress.getCollection('workflow').getAll();
      bobWorkflows.length.should.equal(3);
    });

    it('Remove Bob from the participants list of two workflows', async function() {
      Buttress.setAuthToken(Config.token);
      const allWorkflows = await Buttress.getCollection('workflow').search({
        name: {
          $ne: 'Verify Order',
        }
      });

      for await (const workflow of allWorkflows) {
        await Buttress.getCollection('workflow').update(workflow.id, [{
          path: 'participants.0.__remove__',
          value: '',
        }]);
      }
    });

    it('Bob Should have access to 1 workflow', async function() {
      const bob = testUsers.find((user) => user.auth.find((au) => au.username === 'Bob'));
      Buttress.setAuthToken(bob.tokens[0].value);
      const bobWorkflows = await Buttress.getCollection('workflow').getAll();
      bobWorkflows.length.should.equal(1);
    });

    it('Change Bob company from Lighten to DPC', async function() {
      Buttress.setAuthToken(Config.token);
      const bob = testEmployees.find((em) => em.name === 'Bob');
      const dpc = testCompanies.find((c) => c.name === 'DPC');
      await Buttress.getCollection('employee').update(bob.id, [{
        path: 'companies.0.__remove__',
        value: '',
      }, {
        path: 'companies',
        value: dpc.id,
      }]);
    });

    it('Bob Should have access to 0 workflow as there are no workflows for DPC', async function() {
      const bob = testUsers.find((user) => user.auth.find((au) => au.username === 'Bob'));
      Buttress.setAuthToken(bob.tokens[0].value);
      const bobWorkflows = await Buttress.getCollection('workflow').getAll();
      bobWorkflows.length.should.equal(0);
    });
  });
});
