"use strict";

/**
 * Buttress API -
 *
 * @file app.test.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const Buttress = require('../lib/buttressjs');
const Config = require('./config');

Config.init();

const sleep = (time) => new Promise((r) => setTimeout(r, time));

const user = {
  policyProperties: {
    grade: 1,
    securityClearnce: 1,
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

const attributes = [{
  name: 'working-date',
  disposition: {GET: 'deny', PUT: 'deny', POST: 'deny', DELETE: 'deny', SEARCH: 'deny'},
  env: {
    startDate: '01/01/2022',
    endDate: '31/01/2023',
    date: 'now',
  },
  conditions: {
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
  },
}, {
  name: 'working-hours',
  disposition: {GET: 'allow', PUT: 'deny', POST: 'deny', DELETE: 'deny', SEARCH: 'deny'},
  env: {
    'startTime': '01:00',
    'endTime': '01:01',
    'time': 'now',
  },
  conditions: {
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
  },
}, {
  name: 'active-companies',
  targettedSchema: ['organisation'],
  disposition: {GET: 'allow', PUT: 'deny', POST: 'deny', DELETE: 'deny', SEARCH: 'deny'},
  query: {
    status: {
      '@eq': 'ACTIVE',
    },
  },
}, {
  name: 'companies-a-b',
  targettedSchema: ['organisation'],
  disposition: {GET: 'allow', PUT: 'deny', POST: 'deny', DELETE: 'deny', SEARCH: 'deny'},
  query: {
    '@or': [{
      name: {
        '@rexi': `^a`,
      },
    }, {
      name: {
        '@rexi': '^b',
      },
    }],
  },
}, {
  name: 'companies-name',
  targettedSchema: ['organisation'],
  disposition: {GET: 'allow', PUT: 'allow', POST: 'allow', DELETE: 'deny', SEARCH: 'allow'},
  properties: {
    name: ['READ', 'WRITE'],
  }
}, {
  name: 'companies-info',
  targettedSchema: ['organisation'],
  disposition: {GET: 'allow', PUT: 'allow', POST: 'allow', DELETE: 'allow', SEARCH: 'allow'},
  properties: {
    name: ['READ', 'WRITE'],
    status: ['READ'],
    number: ['READ', 'WRITE'],
  }
}];

const policies = [{
  selection: {
    grade: {
      '@eq': 1,
    },
    securityClearnce: {
      '@eq': 1,
    }
  },
  attributes: ['working-date'],
}, {
  selection: {
    grade: {
      '@eq': 2,
    },
    securityClearnce: {
      '@eq': 2,
    }
  },
  attributes: ['working-hours'],
}, {
  selection: {
    grade: {
      '@eq': 3,
    },
    securityClearnce: {
      '@eq': 3,
    }
  },
  attributes: ['active-companies'],
}, {
  selection: {
    grade: {
      '@eq': 4,
    },
    securityClearnce: {
      '@eq': 4,
    }
  },
  attributes: ['companies-name'],
}, {
  selection: {
    grade: {
      '@eq': 5,
    },
    securityClearnce: {
      '@eq': 5,
    }
  },
  attributes: ['companies-a-b'],
}, {
  selection: {
    grade: {
      '@eq': 6,
    },
    securityClearnce: {
      '@eq': 6,
    }
  },
  attributes: ['companies-info'],
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

describe('@attributes', function() {
  this.timeout(90000);

  const testAttributes = [];
  const testCompanies = [];
  const testPolicies = [];
  let testUser = null;
  let testApp = null;

  const organisationSchema = {
    "name": "organisation",
    "type": "collection",
    "collection": "organisations",
    "properties": {
      "name": {
        "__type": "string",
        "__default": null,
        "__required": true,
        "__allowUpdate": true
      },
      "number": {
        "__type": "string",
        "__default": null,
        "__required": true,
        "__allowUpdate": true
      },
      "status": {
        "__type": "string",
        "__default": null,
        "__required": true,
        "__allowUpdate": true
      }
    }
  }

  before(async function() {
    testApp = await Buttress.App.save({
      name: 'Attribute Test App',
      type: 'server',
      authLevel: 3,
      apiPath: 'attribute-test-app',
    });

    Buttress.setAuthToken(testApp.token);
    Buttress.setAPIPath('attribute-test-app');

    await Buttress.setRoles({
      "default": "public",
      "roles": [
        {
          "name": "public",
          "endpointDisposition": "allowAll",
          "dataDisposition": "allowAll"
        }
      ]
    });

    await Buttress.setSchema([organisationSchema]);

    await sleep(100);

    testUser = await Buttress.Auth.findOrCreateUser(user, authentication);

    await organisations.reduce(async (prev, next) => {
      await prev;
      testCompanies.push(await Buttress.getCollection('organisations').save(next));
    }, Promise.resolve());
  });

  after(async function() {
    Buttress.setAuthToken(Config.token);

    await Buttress.App.remove(testApp.id);

    await testAttributes.reduce(async (prev, next) => {
      await prev;
      await Buttress.Attribute.remove(next.id);
    }, Promise.resolve());

    await Buttress.User.remove(testUser.id);

    await testPolicies.reduce(async (prev, next) => {
      await prev;
      await Buttress.Policy.remove(next.id);
    }, Promise.resolve());

    await Buttress.Token.removeAllUserTokens();
  });

  describe('Basic', function() {
    it('should create attributes for users on the app', async function() {
      await attributes.reduce(async (prev, next) => {
        await prev;
        testAttributes.push(await Buttress.Attribute.createAttribute(next));
      }, Promise.resolve());

      testAttributes[0].name.should.equal('working-date');
      testAttributes.length.should.equal(6);
    });

    it('should create policies on the app', async function() {
      await policies.reduce(async (prev, next) => {
        await prev;
        testPolicies.push(await Buttress.Policy.createPolicy(next));
      }, Promise.resolve());

      testPolicies.length.should.equal(6);
    });

    it('should fail when reading data with deny disposition', async function() {
      Buttress.setAuthToken(testUser.tokens[0].value);

      try {
        await Buttress.getCollection('organisations').getAll();
        throw new Error('it did not fail');
      } catch (err) {
        // needs to change the error to an instance of an error
        err.message.should.equal('Access control policy disposition not allowed');
        err.statusCode.should.equal(401);
      }
    });

    it('should fail when accessing data outside working hours', async function() {
      // update user policy proerty to change the user's policy
      Buttress.setAuthToken(testApp.token);

      await Buttress.User.setPolicyProperty(testUser.id, {
        policyProperties: {
          grade: 2,
          securityClearnce: 2,
        },
      });

      Buttress.setAuthToken(testUser.tokens[0].value);

      try {
        await Buttress.getCollection('organisations').getAll();
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
        policyProperties: {
          grade: 3,
          securityClearnce: 3,
        },
      });
      Buttress.setAuthToken(testUser.tokens[0].value);

      const res = await Buttress.getCollection('organisations').getAll();

      const activeCompanies = res.every((c) => c.status === 'ACTIVE');
      res.length.should.equal(1);
      activeCompanies.should.equal(true);
    });

    it('should only return companies name', async function() {
      // update user policy proerty to change the user's policy
      Buttress.setAuthToken(testApp.token);

      await Buttress.User.setPolicyProperty(testUser.id, {
        policyProperties: {
          grade: 4,
          securityClearnce: 4,
        },
      });

      Buttress.setAuthToken(testUser.tokens[0].value);
      const ids = testCompanies.map((c) => c.id);

      const res = await Buttress.getCollection('organisations').bulkGet(ids);
      const companiesStatus = res.map((company) => company.status).filter((v) => v);
      const companiesName = res.map((company) => company.name).filter((v) => v);
      const companiesNumber = res.map((company) => company.number).filter((v) => v);

      res.length.should.equal(3);
      companiesStatus.length.should.equal(0);
      companiesName.length.should.equal(3);
      companiesNumber.length.should.equal(0);
    });

    it ('should only returns companies starts with letter A or letter B', async function() {
      // update user policy proerty to change the user's policy
      Buttress.setAuthToken(testApp.token);

      await Buttress.User.setPolicyProperty(testUser.id, {
        policyProperties: {
          grade: 5,
          securityClearnce: 5,
        },
      });

      Buttress.setAuthToken(testUser.tokens[0].value);

      const companies = await Buttress.getCollection('organisations').getAll();

      // we know there are only two companies start with A and B
      companies.length.should.equal(2);
    });

    it ('should fail writing to properties and it only has read access to properties', async function() {
      // update user policy proerty to change the user's policy
      Buttress.setAuthToken(testApp.token);

      await Buttress.User.setPolicyProperty(testUser.id, {
        policyProperties: {
          grade: 6,
          securityClearnce: 6,
        },
      });

      Buttress.setAuthToken(testUser.tokens[0].value);

      try {
        await Buttress.getCollection('organisations').update(testCompanies[0].id, [{
          path: 'status',
          value: 'LIQUIDATION',
        }]);
        throw new Error('it did not fail');
      } catch (err) {
        // needs to change the error to an instance of an error
        const company = await Buttress.getCollection('organisations').get(testCompanies[0].id);

        company.status.should.equal('ACTIVE');
        err.message.should.equal('Can not edit properties without privileged access');
        err.statusCode.should.equal(401);
      }
    });

    it ('should partially add a company to the database', async function() {
      // update user policy proerty to change the user's policy
      Buttress.setAuthToken(testApp.token);

      await Buttress.User.setPolicyProperty(testUser.id, {
        policyProperties: {
          grade: 6,
          securityClearnce: 6,
        },
      });

      Buttress.setAuthToken(testUser.tokens[0].value);

      const res = await Buttress.getCollection('organisations').save({
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
        policyProperties: {
          grade: 6,
          securityClearnce: 6,
        },
      });

      Buttress.setAuthToken(testUser.tokens[0].value);

      await Buttress.getCollection('organisations').remove(testCompanies[0].id);
      const companies = await Buttress.getCollection('organisations').getAll();

      companies.length.should.equal(3);
    });
  });
});