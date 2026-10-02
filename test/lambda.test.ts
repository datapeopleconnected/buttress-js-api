/**
 * Buttress API - The federated real-time open data platform
 * Copyright (C) 2016-2024 Data People Connected LTD.
 * <https://www.dpc-ltd.com/>
 *
 * This file is part of Buttress.
 * Buttress is free software: you can redistribute it and/or modify it under the
 * terms of the GNU Affero General Public Licence as published by the Free Software
 * Foundation, either version 3 of the Licence, or (at your option) any later version.
 * Buttress is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Affero General Public Licence for more details.
 * You should have received a copy of the GNU Affero General Public Licence along with
 * this program. If not, see <http://www.gnu.org/licenses/>.
 */

import Sugar from 'sugar';
import fetch from 'cross-fetch';

import Buttress from '../dist/index';
import type {Entity} from '../dist/index';
import type App from '../dist/app';
import type Policy from '../dist/policy';
import type LambdaModel from '../dist/model/Lambda';
import Config from './config';

Config.init();

const sleep = (time: number) => new Promise((r) => setTimeout(r, time));

const authentication = {
  domains: [Config.endpoint],
};

const policies = [
  {
    name: 'admin-lambda',
    version: '1',
    selection: {
      adminAccess: {
        '@eq': true,
      },
    },
    config: [
      {
        verbs: ['%ALL%'],
        schema: ['%ALL%'],
        query: {
          access: '%FULL_ACCESS%',
        },
      },
    ],
  },
  {
    name: 'active-org-lambda',
    version: '1',
    selection: {
      grade: {
        '@eq': 1,
      },
    },
    config: [
      {
        verbs: ['GET', 'SEARCH', 'PUT', 'POST', 'DELETE'],
        schema: ['organisation'],
        query: {
          status: {
            '@eq': 'ACTIVE',
          },
        },
      },
    ],
  },
];

const organisations = [
  {
    name: 'A&A CLEANING LTD LTD',
    number: '1',
    status: 'ACTIVE',
    empolyees: ['John Doe'],
  },
  {
    name: 'B&ESM VISION LTD LTD',
    number: '2',
    status: 'DISSOLVED',
    empolyees: ['John Doe'],
  },
  {
    name: 'C&H CARE SOLUTIONS LTD',
    number: '3',
    status: 'LIQUIDATION',
    empolyees: ['John Doe'],
  },
  {
    name: 'LIGHTEN',
    number: '4',
    status: 'ACTIVE',
    empolyees: ['John Doe'],
  },
];

describe('@lambda', function () {
  this.timeout(90000);
  let testApp: Entity;

  before(async function () {
    Config.configureSuper();

    const existingApps = await Buttress.getCollection<App>('app').getAll();
    const existingApp = existingApps.find((a) => a.name === 'Lambda Test App');
    if (!existingApp) {
      testApp = await Buttress.getCollection<App>('app').save({
        name: 'Lambda Test App',
        type: 'app',
        apiPath: 'lambda-test-app',
      });
    } else {
      testApp = existingApp;
      // Fetch token and attach
      const tokens = await Buttress.Token.getAll();
      const appToken = tokens.find((t) => t.type === 'app' && t._appId === testApp.id);
      if (!appToken) throw new Error('Found app but unable to find app token');
      testApp.token = appToken.value;
    }

    const schemas = [
      {
        name: 'organisation',
        type: 'collection',
        properties: {
          name: {
            __type: 'string',
            __default: null,
            __required: true,
            __allowUpdate: true,
          },
          number: {
            __type: 'string',
            __default: null,
            __required: true,
            __allowUpdate: true,
          },
          status: {
            __type: 'string',
            __default: null,
            __required: true,
            __allowUpdate: true,
          },
          empolyees: {
            __type: 'array',
            __itemtype: 'string',
            __required: true,
            __allowUpdate: true,
          },
        },
      },
      {
        name: 'ticket',
        type: 'collection',
        properties: {
          title: {
            __type: 'string',
            __default: null,
            __required: true,
            __allowUpdate: true,
          },
          ref: {
            __type: 'uuid',
            __default: 'new',
            __required: true,
            __allowUpdate: false,
          },
        },
      },
    ];

    Buttress.setAuthToken(testApp.token);
    Buttress.setAPIPath('lambda-test-app');

    await Buttress.setSchema(schemas);
    await Buttress.getCollection<App>('app').setPolicyPropertyList({
      adminAccess: [true],
      grade: [1],
    });
    await Buttress.getCollection<App>('app').updatePolicyPropertyList({
      adminAccess: [true],
      grade: [1],
    });

    await organisations.reduce(async (prev, next) => {
      await prev;
      await Config.retryUnrouted(() => Buttress.getCollection('organisation').save(next));
    }, Promise.resolve());

    await sleep(1000);
  });

  after(async function () {
    Config.configureSuper();

    await Buttress.Token.removeAllUserTokens();
  });

  describe('Basic', function () {
    it('Should create policies on the app', async function () {
      const appPolicies = [];
      await policies.reduce(async (prev, next) => {
        await prev;
        appPolicies.push(await Buttress.getCollection<Policy>('policy').createPolicy(next));
      }, Promise.resolve());

      appPolicies.length.should.equal(2);
    });

    it('Should create an edit organisation lambda on the app', async function () {
      const lambda: LambdaModel = {
        name: 'organisation-edit-lambda',
        git: {
          url: 'https://github.com/datapeopleconnected/buttress-js-lambda-testing.git',
          hash: '9f7643e1d570e6061933f5b439eeb088af7ac044',
          branch: 'main',
          entryFile: 'edit-data/organisation-edit.js',
          entryPoint: 'execute',
        },
        trigger: [
          {
            type: 'CRON',
            cron: {
              status: 'PENDING',
              periodicExecution: 'in 1 day',
              executionTime: Sugar.Date.create(),
            },
          },
        ],
        policyProperties: {
          adminAccess: true,
        },
      };

      const lambdaDB = await Buttress.Lambda.createLambda(lambda, authentication);
      lambdaDB.name.should.equal('organisation-edit-lambda');
    });

    it('Should fail to create a deployment hash that does not exist on develop branch', async function () {
      const [lambda] = await Buttress.Lambda.search({
        name: {
          $eq: 'organisation-edit-lambda',
        },
      });

      try {
        await Buttress.Lambda.editLambdaDeployment(lambda.id, {
          hash: '554148cea01ed2517a3302b806202f23ce10dc17',
          branch: 'develop',
        });
      } catch (err) {
        (err as {statusCode: number}).statusCode.should.equal(400);
        return;
      }

      throw new Error('it did not fail');
    });

    it('Should create a async get api endpoint lambda to print hello world and call it using its url', async function () {
      const lambda: LambdaModel = {
        name: 'api-hello-world-lambda',
        git: {
          url: 'https://github.com/datapeopleconnected/buttress-js-lambda-testing.git',
          branch: 'main',
          hash: '9f7643e1d570e6061933f5b439eeb088af7ac044',
          entryFile: 'api-hello-world/index.js',
          entryPoint: 'execute',
        },
        trigger: [
          {
            type: 'API_ENDPOINT',
            apiEndpoint: {
              method: 'GET',
              url: 'hello/world',
            },
          },
        ],
        policyProperties: {
          adminAccess: true,
        },
      };

      const lambdaDB = await Buttress.Lambda.createLambda(lambda, authentication);
      lambdaDB.name.should.equal('api-hello-world-lambda');

      const res = await fetch(`${Config.endpoint}/lambda/v1/${testApp.apiPath}/hello/world`, {
        method: 'GET',
        headers: {Authorization: `Bearer ${testApp.token}`},
      });

      const parsedRes = await res.json();
      const executionId = parsedRes.executionId;
      await sleep(5000);

      const statusRes = await fetch(`${Config.endpoint}/api/v1/lambda-execution/${executionId}/status`, {
        method: 'GET',
        headers: {Authorization: `Bearer ${testApp.token}`},
      });
      const resJson = await statusRes.json();
      const status = resJson?.status;
      status.should.equal('COMPLETE');
    });

    it('Should create an a sync get api endpoint lambda to change liquidation organisations name to Test Lambda API', async function () {
      const lambda: LambdaModel = {
        name: 'api-edit-organisation-lambda',
        git: {
          url: 'https://github.com/datapeopleconnected/buttress-js-lambda-testing.git',
          branch: 'main',
          hash: '9f7643e1d570e6061933f5b439eeb088af7ac044',
          entryFile: 'api-edit-data/index.js',
          entryPoint: 'execute',
        },
        trigger: [
          {
            type: 'API_ENDPOINT',
            apiEndpoint: {
              url: 'edit/organisation',
              method: 'GET',
              type: 'SYNC',
            },
          },
        ],
        policyProperties: {
          adminAccess: true,
        },
      };

      const lambdaDB = await Buttress.Lambda.createLambda(lambda, authentication);
      lambdaDB.name.should.equal('api-edit-organisation-lambda');
    });

    it('Should call the api-edit-organisation-lambda lambda to change liquidation organisations name to Test Lambda API', async function () {
      const res = await fetch(`${Config.endpoint}/lambda/v1/${testApp.apiPath}/edit/organisation`, {
        method: 'GET',
        headers: {Authorization: `Bearer ${testApp.token}`},
      });

      if (!res.ok) {
        throw new Error('failed to make the API call');
      }

      const companies = await Buttress.getCollection('organisation').search({
        name: {
          $eq: 'Test Lambda API',
        },
      });

      companies.length.should.equal(1);
    });

    it('Should fail executing a lambda that does not have the required access control policy', async function () {
      const [lambda] = await Buttress.Lambda.search({
        name: {
          $eq: 'api-edit-organisation-lambda',
        },
      });

      // With no policy property the lambda matches no policy. One it matched that only allowed some of the data would
      // filter what the lambda reads rather than fail it.
      await Buttress.Lambda.clearPolicyProperty(lambda.id);

      const res = await fetch(`${Config.endpoint}/lambda/v1/${testApp.apiPath}/edit/organisation`, {
        method: 'GET',
        headers: {Authorization: `Bearer ${testApp.token}`},
      });

      const parsedRes = await res.json();
      const executionId = parsedRes.executionId;

      const statusRes = await fetch(`${Config.endpoint}/api/v1/lambda-execution/${executionId}/status`, {
        method: 'GET',
        headers: {Authorization: `Bearer ${testApp.token}`},
      });
      const resJson = await statusRes.json();
      const status = resJson?.status;
      status.should.equal('ERROR');
    });

    it('Should create a post api endpoint lambda for adding organisations', async function () {
      const lambda: LambdaModel = {
        name: 'api-add-organisation-lambda',
        git: {
          url: 'https://github.com/datapeopleconnected/buttress-js-lambda-testing.git',
          branch: 'main',
          hash: '9f7643e1d570e6061933f5b439eeb088af7ac044',
          entryFile: 'api-add-data/index.js',
          entryPoint: 'execute',
        },
        trigger: [
          {
            type: 'API_ENDPOINT',
            apiEndpoint: {
              url: 'add/organisation',
              method: 'POST',
              type: 'SYNC',
            },
          },
        ],
        policyProperties: {
          adminAccess: true,
        },
      };

      const lambdaDB = await Buttress.Lambda.createLambda(lambda, authentication);
      lambdaDB.name.should.equal('api-add-organisation-lambda');
    });

    it('Should call API add organisation lambda to add an organisation', async function () {
      const organisation = {
        status: 'ACTIVE',
        name: 'Data Performance Consultancy',
        number: 10,
        empolyees: ['John', 'Joe', 'Robert'],
      };

      const res = await fetch(`${Config.endpoint}/lambda/v1/${testApp.apiPath}/add/organisation`, {
        method: 'POST',
        body: JSON.stringify(organisation),
        headers: {
          Authorization: `Bearer ${testApp.token}`,
          'Content-Type': 'application/json',
          'Content-Length': String(JSON.stringify(organisation).length),
        },
      });

      const parsedRes = await res.json();
      const executionId = parsedRes.executionId;

      if (typeof executionId !== 'string') {
        throw new Error('failed to make the API call');
      }

      const statusRes = await fetch(`${Config.endpoint}/api/v1/lambda-execution/${executionId}/status`, {
        method: 'GET',
        headers: {Authorization: `Bearer ${testApp.token}`},
      });
      const resJson = await statusRes.json();
      const status = resJson?.status;

      const companies = await Buttress.getCollection('organisation').search({
        name: {
          $eq: 'Data Performance Consultancy',
        },
      });

      companies.length.should.equal(1);
      status.should.equal('COMPLETE');
    });

    it('Should create a post api endpoint lambda that saves an entity with a uuid default', async function () {
      const lambda = {
        name: 'api-create-ticket-lambda',
        git: {
          url: 'https://github.com/datapeopleconnected/buttress-js-lambda-testing.git',
          branch: 'main',
          hash: '2ce408ce219727d72f11b0c26c416e1c07b5b77a',
          entryFile: 'api-create-ticket/index.js',
          entryPoint: 'execute',
        },
        trigger: [
          {
            type: 'API_ENDPOINT',
            apiEndpoint: {
              url: 'create/ticket',
              method: 'POST',
              type: 'SYNC',
            },
          },
        ],
        policyProperties: {
          adminAccess: true,
        },
      };

      const lambdaDB = await Buttress.Lambda.createLambda(lambda, authentication);
      lambdaDB.name.should.equal('api-create-ticket-lambda');
    });

    it('Should call the lambda to save a ticket, whose uuid the lambda generated in its isolate', async function () {
      const ticket = {title: 'Uuid default'};

      const res = await fetch(`${Config.endpoint}/lambda/v1/${testApp.apiPath}/create/ticket`, {
        method: 'POST',
        body: JSON.stringify(ticket),
        headers: {
          Authorization: `Bearer ${testApp.token}`,
          'Content-Type': 'application/json',
          'Content-Length': JSON.stringify(ticket).length,
        },
      });

      const parsedRes = await res.json();
      const executionId = parsedRes.executionId;

      if (typeof executionId !== 'string') {
        throw new Error('failed to make the API call');
      }

      const statusRes = await fetch(`${Config.endpoint}/api/v1/lambda-execution/${executionId}/status`, {
        method: 'GET',
        headers: {Authorization: `Bearer ${testApp.token}`},
      });
      const status = (await statusRes.json())?.status;

      const tickets = await Buttress.getCollection('ticket').search({title: {$eq: 'Uuid default'}});

      status.should.equal('COMPLETE');
      tickets.length.should.equal(1);
      tickets[0].ref.should.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    });

    it('Should create a name path mutation lambda and use the cr to change organisation name', async function () {
      await Buttress.Lambda.createLambda(
        {
          name: 'name-path-lambda',
          git: {
            url: 'https://github.com/datapeopleconnected/buttress-js-lambda-testing.git',
            hash: 'e7445ba5453a17205270bb93eaff87fda5ff76eb',
            branch: 'main',
            entryFile: 'name-path-mutation/index.js',
            entryPoint: 'execute',
          },
          trigger: [
            {
              type: 'PATH_MUTATION',
              pathMutation: {
                paths: ['organisation.*.name', 'organisation.*.empolyees', 'organisation.empolyees.1'],
              },
            },
          ],
          policyProperties: {
            adminAccess: true,
          },
        },
        authentication,
      );

      const pathMutationTest = await Buttress.getCollection('organisation').save({
        name: 'Path Mutation Test',
        number: '5',
        status: 'ACTIVE',
        empolyees: ['John Doe', 'Jane Doe'],
      });

      await Buttress.getCollection('organisation').update(pathMutationTest.id, [
        {
          path: 'name',
          value: 'DPC LTD',
        },
      ]);

      await sleep(2000);
      const updatedOrg = await Buttress.getCollection('organisation').get(pathMutationTest.id);
      updatedOrg.name.should.equal('Test Lambda Path Mutation');
    });
  });
});
