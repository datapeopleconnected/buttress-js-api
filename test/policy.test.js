'use strict';

/**
 * Buttress API -
 *
 * @file app.test.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const {default: Buttress} = require('../dist/index');
const Config = require('./config');

Config.init();

const sleep = (time) => new Promise((r) => setTimeout(r, time));

const user = {
  app: 'google',
  id: '12345678987654321',
  username: 'Test User',
  token: 'thisisatestthisisatestthisisatestthisisatestthisisatest',
  email: 'test@test.com',
  profileUrl: 'http://test.com/thisisatest',
  profileImgUrl: 'http://test.com/thisisatest.png',
};

const authentication = {
  domains: [Config.endpoint],
  policyProperties: {
    adminAccess: true,
  },
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
    query: [{
      schema: ['%ALL%'],
      access: '%FULL_ACCESS%',
    }],
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
    query: [{
      schema: ['organisation'],
      access: '%FULL_ACCESS%',
    }]
  }],
}, {
  name: 'working-hours',
  selection: {
    grade: {
      '@eq': 2,
    },
  },
  config: [{
    endpoints: ['GET'],
    env: {
      'startTime': '01:00',
      'endTime': '01:01',
      'time': 'now',
    },
    conditions: [{
      'schema': ['organisation'],
      '@and': [{
        time: {
          '@env.time': {
            '@gtDate': 'env.startTime',
          },
        },
      }, {
        time: {
          '@env.time': {
            '@ltDate': 'env.endTime',
          },
        },
      }],
    }],
    query: [{
      schema: ['organisation'],
      access: '%FULL_ACCESS%',
    }]
  }],
}, {
  name: 'active-companies',
  selection: {
    grade: {
      '@eq': 3,
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
  name: 'companies-name',
  selection: {
    grade: {
      '@eq': 4,
    },
  },
  config: [{
    endpoints: ['GET'],
    projection: [{
      schema: ['organisation'],
      keys: ['name']
    }],
  }],
}, {
  name: 'companies-info',
  selection: {
    grade: {
      '@eq': 5,
    },
  },
  config: [{
    endpoints: ['GET', 'SEARCH', 'DELETE'],
    projection: [{
      schema: ['organisation'],
      keys: ['name', 'status', 'number'],
    }],
  }, {
    endpoints: ['PUT', 'POST'],
    projection: [{
      schema: ['organisation'],
      keys: ['name', 'number'],
    }],
  }],
}, {
  name: 'summer-working-date',
  priority: 1,
  merge: true,
  selection: {
    grade: {
      '@eq': 6,
    },
  },
  config: [{
    endpoints: ['GET'],
    env: {
      startDate: '01/07/2022',
      endDate: '31/08/2023',
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
    query: [{
      schema: ['organisation'],
      access: '%FULL_ACCESS%',
    }]
  }],
}, {
  name: 'summer-working-hours',
  priority: 2,
  merge: true,
  selection: {
    securityClearance: {
      '@eq': 1,
    },
  },
  config: [{
    endpoints: ['GET'],
    env: {
      'startTime': '01:00',
      'endTime': '01:01',
      'time': 'now',
    },
    conditions: [{
      'schema': ['organisation'],
      '@and': [{
        time: {
          '@env.time': {
            '@gtDate': 'env.startTime',
          },
        },
      }, {
        time: {
          '@env.time': {
            '@ltDate': 'env.endTime',
          },
        },
      }],
    }],
    projection: [{
      schema: ['organisation'],
      keys: ['name'],
    }],
  }],
}, {
  name: 'override-access',
  selection: {
    securityClearance: {
      '@eq': 100,
    },
  },
  config: [{
    endpoints: ['GET'],
    env: {
      'switch' : {
        'id': '62b09ee325c88db16d9da6ca',
        'state': 'ON'
      },
    },
    conditions: [{
      'schema': ['organisation'],
      '@and': [{
          'query.switch': {
            'switch.id': {
              '@eq': 'env.switch.id'
            },
            'switch.state': {
              '@eq': 'env.switch.state'
            }
          }
        }],
    }],
  }],
}, {
  name: 'projection-1',
  priority: 1,
  merge: true,
  selection: {
    policyProjection: {
      '@gte': 1,
    },
  },
  config: [{
    endpoints: ['GET'],
    projection: [{
      schema: ['organisation'],
      keys: ['name']
    }],
  }],
}, {
  name: 'projection-2',
  priority: 2,
  merge: true,
  selection: {
    policyProjection: {
      '@gte': 2,
    },
  },
  config: [{
    endpoints: ['GET'],
    projection: [{
      schema: ['organisation'],
      keys: ['number']
    }],
  }, {
    endpoints: ['GET'],
    projection: [{
      schema: ['organisation'],
      keys: ['status']
    }],
  }],
}, {
  name: 'query-1',
  priority: 1,
  merge: true,
  selection: {
    policyMergeQuery: {
      '@gte': 1,
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
  name: 'query-2',
  priority: 2,
  merge: true,
  selection: {
    policyMergeQuery: {
      '@gte': 2,
    },
  },
  config: [{
    endpoints: ['GET'],
    query: [{
      schema: ['organisation'],
      status: {
        '@eq': 'DISSOLVED',
      },
    }],
  }],
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

const overrideSwitch = {
  id: '62b09ee325c88db16d9da6ca',
  state: 'OFF',
  name: 'Override Switch',
};

describe('@policy', function() {
  this.timeout(90000);

  const testCompanies = [];
  const testPolicies = [];
  let testSwitch = null;
  let testUser = null;
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
    'name': 'switch',
    'type': 'collection',
    'properties': {
      'name': {
        '__type': 'string',
        '__default': null,
        '__required': true,
        '__allowUpdate': true
      },
      'state': {
        '__type': 'string',
        '__default': null,
        '__required': true,
        '__allowUpdate': true,
        '__enum': [
          'ON',
          'OFF'
        ]
      }
    }
  }]

  before(async function() {
    Buttress.setAuthToken(Config.token);

    const existingApps = await Buttress.App.getAll();
    testApp = existingApps.find((a) => a.name === 'Socket Test App');
    if (!testApp) {
      testApp = await Buttress.App.save({
        name: 'Policy Test App',
        apiPath: 'policy-test-app',
        policyPropertiesList: {
          adminAccess: [true],
        },
      });
    } else {
      // Fetch token and attach
      const tokens = await Buttress.Token.getAll();
      const appToken = tokens.find((t) => t.type === 'app' && t._app === testApp.id);
      if (!appToken) throw new Error('Found app but unable to find app token');
      testApp.token = appToken.value;
    }

    Buttress.setAuthToken(testApp.token);
    Buttress.setAPIPath('policy-test-app');

    await Buttress.setSchema(schemas);

    await sleep(1000);

    testUser = await Buttress.Auth.findOrCreateUser(user, authentication);

    await organisations.reduce(async (prev, next) => {
      await prev;
      testCompanies.push(await Buttress.getCollection('organisation').save(next));
    }, Promise.resolve());

    testSwitch = await Buttress.getCollection('switch').save(overrideSwitch);
  });

  after(async function() {
    Buttress.setAuthToken(Config.token);

    await Buttress.User.remove(testUser.id);

    await testPolicies.reduce(async (prev, next) => {
      await prev;
      await Buttress.Policy.remove(next.id);
    }, Promise.resolve());

    await Buttress.getCollection('switch').remove(testSwitch.id);

    await Buttress.Token.removeAllUserTokens();
  });

  describe('Basic', function() {
    it('Should create policies on the app', async function() {
      await policies.reduce(async (prev, next) => {
        await prev;
        testPolicies.push(await Buttress.Policy.createPolicy(next));
      }, Promise.resolve());

      testPolicies.length.should.equal(13);
    });

    it('Should access app companies using admin access policy', async function() {
      Buttress.setAuthToken(testUser.tokens[0].value);

      const res = await Buttress.getCollection('organisation').getAll();
      res.length.should.equal(3);
    });

    it('Should fail accessing app companies using grade 0 policy', async function() {
      // update user policy proerty to change the user's policy
      Buttress.setAuthToken(testApp.token);
      await Buttress.User.setPolicyProperty(testUser.id, {
        grade: 0,
      });

      try {
        Buttress.setAuthToken(testUser.tokens[0].value);
        await Buttress.getCollection('organisation').getAll();
        throw new Error('it did not fail');
      } catch (err) {
        // needs to change the error to an instance of an error
        err.message.should.equal('Request does not have any policy associated to it');
        err.statusCode.should.equal(401);
      }
    });

    it('Should access app companies using grade 1 policy', async function() {
      // update user policy proerty to change the user's policy
      Buttress.setAuthToken(testApp.token);

      await Buttress.User.setPolicyProperty(testUser.id, {
        grade: 1,
      });

      Buttress.setAuthToken(testUser.tokens[0].value);

      const res = await Buttress.getCollection('organisation').getAll();
      res.length.should.equal(3);
    });

    it('should fail when accessing data outside working hours', async function() {
      // update user policy proerty to change the user's policy
      Buttress.setAuthToken(testApp.token);

      await Buttress.User.setPolicyProperty(testUser.id, {
        grade: 2,
      });

      Buttress.setAuthToken(testUser.tokens[0].value);

      try {
        await Buttress.getCollection('organisation').getAll();
        throw new Error('it did not fail');
      } catch (err) {
        // needs to change the error to an instance of an error
        err.message.should.equal('Access control policy conditions are not fulfilled');
        err.statusCode.should.equal(401);
      }
    });

    it('should only return active companies', async function() {
      // update user policy proerty to change the user's policy
      Buttress.setAuthToken(testApp.token);

      await Buttress.User.setPolicyProperty(testUser.id, {
        grade: 3,
      });
      Buttress.setAuthToken(testUser.tokens[0].value);

      const res = await Buttress.getCollection('organisation').getAll();

      const activeCompanies = res.every((c) => c.status === 'ACTIVE');
      res.length.should.equal(1);
      activeCompanies.should.equal(true);
    });

    it ('should fail writing to properties and the policy does not include writing verb', async function() {
      // update user policy proerty to change the user's policy
      Buttress.setAuthToken(testApp.token);

      await Buttress.User.setPolicyProperty(testUser.id, {
        grade: 3,
      });

      Buttress.setAuthToken(testUser.tokens[0].value);

      try {
        await Buttress.getCollection('organisation').update(testCompanies[0].id, [{
          path: 'name',
          value: 'Test demo company',
        }]);
        throw new Error('it did not fail');
      } catch (err) {
        // needs to change the error to an instance of an error
        const company = await Buttress.getCollection('organisation').get(testCompanies[0].id);

        company.status.should.equal('ACTIVE');
        err.message.should.equal('Request does not have any policy rules matching the request verb');
        err.statusCode.should.equal(401);
      }
    });

    it('should only return companies name', async function() {
      // update user policy proerty to change the user's policy
      Buttress.setAuthToken(testApp.token);

      await Buttress.User.setPolicyProperty(testUser.id, {
        grade: 4,
      });

      Buttress.setAuthToken(testUser.tokens[0].value);

      const res = await Buttress.getCollection('organisation').getAll();
      const companiesStatus = res.map((company) => company.status).filter((v) => v);
      const companiesName = res.map((company) => company.name).filter((v) => v);
      const companiesNumber = res.map((company) => company.number).filter((v) => v);

      res.length.should.equal(3);
      companiesStatus.length.should.equal(0);
      companiesName.length.should.equal(3);
      companiesNumber.length.should.equal(0);
    });

    it ('should fail writing to properties and it only has read access to properties', async function() {
      // update user policy proerty to change the user's policy
      Buttress.setAuthToken(testApp.token);

      await Buttress.User.setPolicyProperty(testUser.id, {
        grade: 5,
      });

      Buttress.setAuthToken(testUser.tokens[0].value);

      try {
        await Buttress.getCollection('organisation').update(testCompanies[0].id, [{
          path: 'status',
          value: 'LIQUIDATION',
        }]);
        throw new Error('it did not fail');
      } catch (err) {
        // needs to change the error to an instance of an error
        Buttress.setAuthToken(testApp.token);
        const company = await Buttress.getCollection('organisation').get(testCompanies[0].id);
        company.status.should.equal('ACTIVE');
        err.message.should.equal('Can not access/edit properties without privileged access');
        err.statusCode.should.equal(401);
      }
    });

    it ('should partially add a company to the database', async function() {
      // update user policy proerty to change the user's policy
      Buttress.setAuthToken(testApp.token);

      await Buttress.User.setPolicyProperty(testUser.id, {
        grade: 5,
      });

      Buttress.setAuthToken(testUser.tokens[0].value);

      const res = await Buttress.getCollection('organisation').save({
        name: 'DPC ltd',
        number: '100',
        status: 'ACTIVE',
      });

      (res.status === null).should.be.true;
    });

    it ('should delete a company from the database', async function() {
      // update user policy proerty to change the user's policy
      Buttress.setAuthToken(testApp.token);

      await Buttress.User.setPolicyProperty(testUser.id, {
        grade: 5,
      });

      Buttress.setAuthToken(testUser.tokens[0].value);

      await Buttress.getCollection('organisation').remove(testCompanies[0].id);
      const companies = await Buttress.getCollection('organisation').search({});

      companies.length.should.equal(3);
    });

    it ('should ignore summer-working-hours policy as its condition is not fulfilled', async function() {
      // update user policy proerty to change the user's policy
      Buttress.setAuthToken(testApp.token);

      await Buttress.User.setPolicyProperty(testUser.id, {
        grade: 6,
        securityClearance: 1,
      });

      Buttress.setAuthToken(testUser.tokens[0].value);

      const res = await Buttress.getCollection('organisation').getAll();
      const companiesStatus = res.map((company) => company.status).filter((v) => v);
      const companiesName = res.map((company) => company.name).filter((v) => v);
      const companiesNumber = res.map((company) => company.number).filter((v) => v);

      res.length.should.equal(3);
      companiesStatus.length.should.equal(2);
      companiesName.length.should.equal(3);
      companiesNumber.length.should.equal(3);
    });

    it ('should fail override-access policy as the override switch is off', async function() {
      // update user policy proerty to change the user's policy
      Buttress.setAuthToken(testApp.token);

      await Buttress.User.setPolicyProperty(testUser.id, {
        securityClearance: 100,
      });

      Buttress.setAuthToken(testUser.tokens[0].value);

      try {
        await Buttress.getCollection('organisation').getAll();
        throw new Error('it did not fail');
      } catch (err) {
        // needs to change the error to an instance of an error
        err.message.should.equal('Access control policy conditions are not fulfilled');
        err.statusCode.should.equal(401);
      }
    });

    it ('should access data after admin turns on the override switch', async function() {
      // update user policy proerty to change the user's policy
      Buttress.setAuthToken(testApp.token);

      await Buttress.getCollection('switch').update(testSwitch.id, {
        path: 'state',
        value: 'ON',
      });

      Buttress.setAuthToken(testUser.tokens[0].value);

      const res = await Buttress.getCollection('organisation').getAll();
      res.length.should.equal(3);
    });

    it ('should merge policies projection', async function() {
      // update user policy proerty to change the user's policy
      Buttress.setAuthToken(testApp.token);

      await Buttress.User.setPolicyProperty(testUser.id, {
        policyProjection: 2,
      });

      Buttress.setAuthToken(testUser.tokens[0].value);

      const res = await Buttress.getCollection('organisation').getAll();
      const companiesStatus = res.map((company) => company.status).filter((v) => v);
      const companiesName = res.map((company) => company.name).filter((v) => v);
      const companiesNumber = res.map((company) => company.number).filter((v) => v);

      res.length.should.equal(3);
      companiesStatus.length.should.equal(2);
      companiesName.length.should.equal(3);
      companiesNumber.length.should.equal(0);
    });

    it ('should override policies query', async function() {
      // update user policy proerty to change the user's policy
      Buttress.setAuthToken(testApp.token);

      await Buttress.User.setPolicyProperty(testUser.id, {
        policyMergeQuery: 2,
      });

      Buttress.setAuthToken(testUser.tokens[0].value);

      const res = await Buttress.getCollection('organisation').getAll();

      const activeCompanies = res.every((c) => c.status === 'DISSOLVED');
      res.length.should.equal(1);
      activeCompanies.should.equal(true);
    });
  });
});