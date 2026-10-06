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

import assert from 'assert';
import http from 'http';
import type {AddressInfo} from 'net';

import Buttress, {Errors} from '../../dist/index';
import type {ButtressOptions, Policy} from '../../dist/index';
import App from '../../dist/app';

const schema = [{name: 'thing', type: 'collection', properties: {name: {__type: 'string'}}}];

// The options type requires a version, which these tests have never passed
const options = (partial: Record<string, unknown>) => partial as unknown as ButtressOptions;

interface RecordedRequest {
  method?: string;
  url?: string;
  headers: http.IncomingHttpHeaders;
  raw: string;
  body: any;
}

interface Reply {
  status?: number;
  body?: unknown;
  destroy?: boolean;
}

interface TestServer {
  requests: RecordedRequest[];
  reply: (request: RecordedRequest, count: number) => Reply;
  url: string;
  close: () => Promise<void>;
}

/**
 * A stand-in for buttress which records each request and replies with whatever `reply` returns.
 */
const startServer = async (): Promise<TestServer> => {
  const requests: RecordedRequest[] = [];
  const state = {requests, reply: (() => ({status: 200, body: {}})) as TestServer['reply']};

  const server = http.createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      const request: RecordedRequest = {
        method: req.method,
        url: req.url,
        headers: req.headers,
        raw,
        body: raw ? JSON.parse(raw) : undefined,
      };
      state.requests.push(request);

      const reply = state.reply(request, state.requests.length);
      if (reply.destroy) return req.socket.destroy();

      res.writeHead(reply.status as number, {'Content-Type': 'application/json'});
      res.end(JSON.stringify(reply.body));
    });
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const {port} = server.address() as AddressInfo;
  return Object.assign(state, {
    url: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  });
};

describe('Requests', () => {
  let server: TestServer;
  let instance: ReturnType<typeof Buttress.new>;

  before(async () => {
    server = await startServer();
    instance = Buttress.new();
    await instance.init(
      options({
        buttressUrl: server.url,
        appToken: 'APP_TOKEN',
        apiPath: 'test-app',
        schema,
        useLocalSchema: true,
        clientSessionId: '4f7b2b9e-6c1a-4a5e-9d3b-2f6f0c8a1e11',
      }),
    );
  });

  beforeEach(() => {
    server.requests.length = 0;
    server.reply = () => ({status: 200, body: {}});
  });

  after(() => server.close());

  it('should surface the message from a buttress error body', async () => {
    server.reply = () => ({status: 401, body: {code: 'invalid_token', message: 'The token is not valid'}});

    await assert.rejects(instance.getCollection('thing').getAll(), (err: unknown) => {
      assert(err instanceof Errors.ResponseError);
      assert.strictEqual(err.statusCode, 401);
      assert.strictEqual(err.statusMessage, 'Unauthorized');
      assert.strictEqual(err.message, 'The token is not valid');
      assert.strictEqual(err.errorCode, 'invalid_token');
      // code stays the HTTP status
      assert.strictEqual(err.code, 401);
      return true;
    });
  });

  it('should leave errorCode out when the error body has no code', async () => {
    server.reply = () => ({status: 502, body: {message: 'Bad gateway'}});

    await assert.rejects(instance.getCollection('thing').getAll(), (err) => {
      assert(err instanceof Errors.ResponseError);
      assert.strictEqual(err.errorCode, undefined);
      assert.strictEqual(err.statusCode, 502);
      return true;
    });
  });

  it('should send a non-ASCII body intact', async () => {
    await instance.getCollection('thing').save({name: 'Café ☕'});

    assert.strictEqual(server.requests[0].body.name, 'Café ☕');
  });

  it('should URL encode query params', async () => {
    await instance.getCollection('thing').getAll({params: {q: 'a&b=c d'}});

    assert.strictEqual(server.requests[0].url, '/test-app/api/v1/thing?q=a%26b%3Dc%20d');
  });

  it('should send the client session id header', async () => {
    await instance.getCollection('thing').getAll();

    assert.strictEqual(server.requests[0].headers['x-client-session-id'], '4f7b2b9e-6c1a-4a5e-9d3b-2f6f0c8a1e11');
  });

  it('should let combineResults be turned off', async () => {
    const duplicates = [
      {id: '1', sourceId: 'a', name: 'x'},
      {id: '1', sourceId: 'a', name: 'y'},
    ];
    server.reply = () => ({status: 200, body: duplicates});

    assert.strictEqual((await instance.getCollection('thing').getAll()).length, 1);
    assert.strictEqual((await instance.getCollection('thing').getAll({combineResults: false})).length, 2);
  });

  it('should retry a GET that never got a response', async () => {
    server.reply = (_req, count) => (count === 1 ? {destroy: true} : {status: 200, body: [{id: '1'}]});

    const res = await instance.getCollection('thing').getAll();

    assert.deepStrictEqual(res, [{id: '1'}]);
    assert.strictEqual(server.requests.length, 2);
  });

  it('should not retry a GET that never got a response when maxRetries is 0', async () => {
    const noRetry = Buttress.new();
    await noRetry.init(
      options({
        buttressUrl: server.url,
        appToken: 'APP_TOKEN',
        apiPath: 'test-app',
        schema,
        useLocalSchema: true,
        maxRetries: 0,
      }),
    );
    server.reply = () => ({destroy: true});

    await assert.rejects(noRetry.getCollection('thing').getAll(), (err: unknown) => err instanceof Errors.RequestError);
    assert.strictEqual(server.requests.length, 1);
  });

  it('should retry maxRetries times after the first attempt', async () => {
    const oneRetry = Buttress.new();
    await oneRetry.init(
      options({
        buttressUrl: server.url,
        appToken: 'APP_TOKEN',
        apiPath: 'test-app',
        schema,
        useLocalSchema: true,
        maxRetries: 1,
      }),
    );
    server.reply = () => ({destroy: true});

    await assert.rejects(
      oneRetry.getCollection('thing').getAll(),
      (err: unknown) => err instanceof Errors.RequestError,
    );
    assert.strictEqual(server.requests.length, 2);
  });

  it('should search, count and bulk load with QUERY', async () => {
    await instance.getCollection('thing').search({name: {$eq: 'x'}});
    await instance.getCollection('thing').count({name: {$eq: 'x'}});
    await instance.getCollection('thing').bulkGet(['1', '2']);
    await instance.Policy.search({});

    assert.deepStrictEqual(
      server.requests.map((r) => `${r.method} ${r.url}`),
      [
        'QUERY /test-app/api/v1/thing',
        'QUERY /test-app/api/v1/thing/count',
        'QUERY /test-app/api/v1/thing/bulk/load',
        'QUERY /api/v1/policy',
      ],
    );
    assert.deepStrictEqual(server.requests[0].body, {query: {name: {$eq: 'x'}}, limit: 0, skip: 0, sort: 0});
  });

  it('should send a JSON Content-Type with every QUERY', async () => {
    await instance.getCollection('thing').search({});
    await instance.getCollection('thing').count();
    await instance.getCollection('thing').bulkGet(undefined as unknown as string[]);

    for (const req of server.requests) {
      assert.strictEqual(req.method, 'QUERY');
      assert.strictEqual(req.headers['content-type'], 'application/json');
    }
    // A bulk load without ids still sends a body, buttress refuses a QUERY without one
    assert.deepStrictEqual(server.requests[2].body, {});
  });

  it('should keep passed headers alongside the QUERY Content-Type', async () => {
    await instance.getCollection('thing').search({}, 0, 0, 0, {headers: {'x-custom': 'yes'}});

    const [req] = server.requests;
    assert.strictEqual(req.headers['x-custom'], 'yes');
    assert.strictEqual(req.headers['content-type'], 'application/json');
    assert.strictEqual(req.headers['authorization'], 'Bearer APP_TOKEN');
  });

  it('should retry a QUERY that never got a response', async () => {
    server.reply = (_req, count) => (count === 1 ? {destroy: true} : {status: 200, body: [{id: '1'}]});

    const res = await instance.getCollection('thing').search({});

    assert.deepStrictEqual(res, [{id: '1'}]);
    assert.deepStrictEqual(
      server.requests.map((r) => r.method),
      ['QUERY', 'QUERY'],
    );
    assert.strictEqual(server.requests[1].headers['content-type'], 'application/json');
    assert.deepStrictEqual(server.requests[1].body, server.requests[0].body);
  });

  it('should update an entity in a remote datastore by sourceId', async () => {
    await instance.getCollection('thing').update('ID', [{path: 'name', value: 'x'}], {sourceId: 'SOURCE'});

    assert.strictEqual(server.requests[0].url, '/test-app/api/v1/thing/SOURCE/ID');
  });

  it('should send a single update as an array, as the core collections need', async () => {
    await instance.Policy.update('ID', {path: 'priority', value: 1});

    assert.strictEqual(server.requests[0].url, '/api/v1/policy/ID');
    assert.deepStrictEqual(server.requests[0].body, [{path: 'priority', value: 1}]);
  });

  it('should send each bulk update body as an array', async () => {
    await instance.getCollection('thing').bulkUpdate([
      {id: '1', body: {path: 'name', value: 'x'}},
      {id: '2', sourceId: 'SOURCE', body: [{path: 'name', value: 'y'}]},
    ]);

    assert.deepStrictEqual(server.requests[0].body, [
      {id: '1', body: [{path: 'name', value: 'x'}]},
      {id: '2', sourceId: 'SOURCE', body: [{path: 'name', value: 'y'}]},
    ]);
  });

  it('should send actualCount with a count', async () => {
    await instance.getCollection('thing').count({}, {}, {actualCount: true});

    assert.strictEqual(server.requests[0].body.actualCount, true);
  });

  it('should count everything when no query is passed', async () => {
    await instance.getCollection('thing').count();
    await instance.getCollection('thing').count(undefined, undefined, {actualCount: true});

    // Buttress treats a body without a query as the query itself, so it would filter on actualCount
    assert.deepStrictEqual(server.requests[0].body, {query: {}});
    assert.deepStrictEqual(server.requests[1].body, {query: {}, actualCount: true});
  });

  it('should refuse a removeAll filter as buttress would remove everything', async () => {
    assert.throws(() => instance.getCollection('thing').removeAll({name: 'x'} as unknown as null), /bulkRemove/);
    assert.strictEqual(server.requests.length, 0);
  });

  it('should activate data sharing with the registration token in the Authorization header', async () => {
    await instance.AppDataSharing.activate('REGISTRATION_TOKEN', 'NEW_TOKEN');

    const [req] = server.requests;
    assert.strictEqual(req.url, '/api/v1/app-data-sharing/activate');
    assert.strictEqual(req.headers['authorization'], 'Bearer REGISTRATION_TOKEN');
    assert.deepStrictEqual(req.body, {newToken: 'NEW_TOKEN'});
  });

  it('should reactivate and deactivate data sharing with PUT', async () => {
    await instance.AppDataSharing.reactivate('DS_ID');
    await instance.AppDataSharing.deactivate('DS_ID');

    assert.deepStrictEqual(
      server.requests.map((r) => `${r.method} ${r.url}`),
      ['PUT /api/v1/app-data-sharing/reactivate/DS_ID', 'PUT /api/v1/app-data-sharing/deactivate/DS_ID'],
    );
  });

  it('should target the user token when changing policy properties', async () => {
    await instance.User.setPolicyProperty('USER_ID', 'TOKEN_ID', {role: 'admin'});
    await instance.User.updatePolicyProperty('USER_ID', 'TOKEN_ID', {role: 'admin'});
    await instance.User.removePolicyProperty('USER_ID', 'TOKEN_ID', {role: 'admin'});
    await instance.User.clearPolicyProperty('USER_ID', 'TOKEN_ID');

    assert.deepStrictEqual(
      server.requests.map((r) => r.url),
      [
        '/api/v1/user/USER_ID/policy-property/TOKEN_ID',
        '/api/v1/user/USER_ID/update-policy-property/TOKEN_ID',
        '/api/v1/user/USER_ID/remove-policy-property/TOKEN_ID',
        '/api/v1/user/USER_ID/clear-policy-property/TOKEN_ID',
      ],
    );
  });

  it('should get the policy property list for the authenticated app', async () => {
    await instance.App.getPolicyPropertiesList();

    assert.strictEqual(server.requests[0].url, '/api/v1/app/policy-property-list');
  });

  it('should set policy properties on the token of an existing user by its id, never its value', async () => {
    server.reply = (req) => {
      // Finding a user by its auth app id returns only the tokens' values, getting it by id returns their ids too
      if (req.url === '/api/v1/user/google/G1')
        return {status: 200, body: {id: 'USER_ID', auth: [], tokens: [{value: 'TOKEN_VALUE', policyProperties: null}]}};
      if (req.url === '/api/v1/user/USER_ID')
        return {status: 200, body: {id: 'USER_ID', auth: [], tokens: [{id: 'TOKEN_ID', value: 'TOKEN_VALUE'}]}};
      return {status: 200, body: true};
    };

    const user = await instance.Auth.findOrCreateUser(
      {app: 'google', appId: 'G1', policyProperties: {role: 'user'}},
      {domains: []},
    );

    assert.deepStrictEqual(
      server.requests.map((r) => `${r.method} ${r.url}`),
      ['GET /api/v1/user/google/G1', 'GET /api/v1/user/USER_ID', 'PUT /api/v1/user/USER_ID/policy-property/TOKEN_ID'],
    );
    assert.deepStrictEqual(user.tokens[0].policyProperties, {role: 'user'});
  });

  it('should refuse to set policy properties on a token it has no id for', async () => {
    server.reply = (req) =>
      req.url === '/api/v1/user/google/G1'
        ? {status: 200, body: {id: 'USER_ID', auth: [], tokens: [{value: 'TOKEN_VALUE', policyProperties: null}]}}
        : {status: 200, body: {id: 'USER_ID', auth: [], tokens: [{value: 'TOKEN_VALUE'}]}};

    await assert.rejects(
      instance.Auth.findOrCreateUser({app: 'google', appId: 'G1', policyProperties: {role: 'user'}}, {domains: []}),
      /the token has no id/,
    );
    assert(!server.requests.some((r) => r.url?.includes('TOKEN_VALUE')), 'the token value was sent in a URL');
    assert(!server.requests.some((r) => r.method === 'PUT'));
  });

  it('should create a user token carrying the policy properties', async () => {
    server.reply = (req) => {
      if (req.method === 'GET')
        return {status: 404, body: {statusMessage: 'user_not_found', message: 'user_not_found'}};
      return {
        status: 200,
        body: {id: 'USER_ID', auth: [], tokens: [{value: 'TOKEN_VALUE', policyProperties: {role: 'user'}}]},
      };
    };

    await instance.Auth.findOrCreateUser({app: 'google', appId: 'G1', policyProperties: {role: 'user'}}, {domains: []});

    const post = server.requests.find((r) => r.method === 'POST');
    assert.deepStrictEqual((post as RecordedRequest).body.token, {domains: [], policyProperties: {role: 'user'}});
    assert.strictEqual(server.requests.length, 2);
  });

  describe('Secure store', () => {
    const storeData = {zero: 0, empty: '', no: false, nothing: null, name: 'x'};

    beforeEach(() => {
      server.reply = () => ({status: 200, body: {id: '1', name: 'store', storeData}});
    });

    it('should read back a stored 0, empty string, false or null', async () => {
      const store = await instance.SecureStore.findByName('store');

      assert.strictEqual(store.getValue('zero'), 0);
      assert.strictEqual(store.getValue('empty'), '');
      assert.strictEqual(store.getValue('no'), false);
      assert.strictEqual(store.getValue('nothing'), null);
      assert.strictEqual(store.getValue('name'), 'x');
    });

    it('should throw for a key the store does not hold', async () => {
      const store = await instance.SecureStore.findByName('store');

      assert.throws(() => store.getValue('missing'), /^Error: missing does not exist on the secure store store$/);
      // An inherited property isn't a stored value
      assert.throws(() => store.getValue('toString'), /toString does not exist/);
    });
  });

  describe('Lambda scheduling', () => {
    const metadata = [{key: 'a', value: 1}];

    it('should send the metadata when no start time is given', async () => {
      await instance.Lambda.scheduleExecution('L1', undefined, metadata);
      await instance.Lambda.scheduleExecution('L1', null, metadata);

      assert.strictEqual(server.requests[0].url, '/api/v1/lambda/L1/schedule');
      assert.deepStrictEqual(server.requests[0].body, {metadata});
      assert.deepStrictEqual(server.requests[1].body, {metadata});
    });

    it('should send the start time and metadata when both are given', async () => {
      await instance.Lambda.scheduleExecution('L1', 'in 5 minutes', metadata);

      assert.deepStrictEqual(server.requests[0].body, {executeAfter: 'in 5 minutes', metadata});
    });

    it('should leave out a start time or metadata that is not given', async () => {
      await instance.Lambda.scheduleExecution('L1', 'in 5 minutes');
      await instance.Lambda.scheduleExecution('L1');

      assert.deepStrictEqual(server.requests[0].body, {executeAfter: 'in 5 minutes'});
      assert.deepStrictEqual(server.requests[1].body, {});
    });

    it('should keep other data passed in the options', async () => {
      await instance.Lambda.scheduleExecution('L1', 'in 5 minutes', metadata, {data: {deploymentId: 'D1'}});

      assert.deepStrictEqual(server.requests[0].body, {deploymentId: 'D1', executeAfter: 'in 5 minutes', metadata});
    });
  });

  describe('Path segments', () => {
    // A call that throws before returning its promise counts as refused too
    const refuses = async (call: () => Promise<unknown>) => {
      await assert.rejects(async () => call(), /path segment/);
    };

    const sent = () => server.requests.map((r) => `${r.method} ${r.url}`);

    it('should encode an id holding /, ? or # as one segment', async () => {
      const thing = instance.getCollection('thing');
      await thing.get('a/b');
      await thing.get('a?b=c');
      await thing.get('a#b');
      await thing.get('../user');
      await thing.update('a/b', {path: 'name', value: 'x'});
      await thing.update('a#b', {path: 'name', value: 'x'}, {sourceId: '../SOURCE'});
      await thing.remove('a?b');

      assert.deepStrictEqual(sent(), [
        'GET /test-app/api/v1/thing/a%2Fb',
        'GET /test-app/api/v1/thing/a%3Fb%3Dc',
        'GET /test-app/api/v1/thing/a%23b',
        'GET /test-app/api/v1/thing/..%2Fuser',
        'PUT /test-app/api/v1/thing/a%2Fb',
        'PUT /test-app/api/v1/thing/..%2FSOURCE/a%23b',
        'DELETE /test-app/api/v1/thing/a%3Fb',
      ]);
    });

    it('should refuse an id of . or .., or an empty one', async () => {
      const thing = instance.getCollection('thing');
      await refuses(() => thing.get('..'));
      await refuses(() => thing.get('.'));
      await refuses(() => thing.get(''));
      await refuses(() => thing.update('..', {path: 'name', value: 'x'}));
      await refuses(() => thing.update('ID', {path: 'name', value: 'x'}, {sourceId: '..'}));
      await refuses(() => thing.remove('..'));
      await refuses(() => thing.remove(undefined as unknown as string));

      assert.strictEqual(server.requests.length, 0);
    });

    it('should encode the user ids and names in a user path', async () => {
      await instance.User.findUser('google/x', '../1');
      await instance.User.getUser('a?b=c');
      await instance.User.createToken('a#b', {domains: []});
      await instance.User.setPolicyProperty('../app', 'TOKEN/ID', {role: 'admin'});
      await instance.User.clearPolicyProperty('a?b', 'TOKEN#ID');

      assert.deepStrictEqual(sent(), [
        'GET /api/v1/user/google%2Fx/..%2F1',
        'GET /api/v1/user/a%3Fb%3Dc',
        'POST /api/v1/user/a%23b/token',
        'PUT /api/v1/user/..%2Fapp/policy-property/TOKEN%2FID',
        'PUT /api/v1/user/a%3Fb/clear-policy-property/TOKEN%23ID',
      ]);
    });

    it('should refuse a user id or token id of . or ..', async () => {
      await refuses(() => instance.User.findUser('..', 'G1'));
      await refuses(() => instance.User.findUser('google', '.'));
      await refuses(() => instance.User.getUser('..'));
      await refuses(() => instance.User.createToken('..', {domains: []}));
      await refuses(() => instance.User.updatePolicyProperty('..', 'TOKEN_ID', {role: 'admin'}));
      await refuses(() => instance.User.removePolicyProperty('USER_ID', '..', {role: 'admin'}));

      assert.strictEqual(server.requests.length, 0);
    });

    it('should encode a secure store name', async () => {
      await instance.SecureStore.findByName('a/b?c#d');
      await instance.SecureStore.findByName('..%2F..');

      assert.deepStrictEqual(sent(), [
        'GET /api/v1/secure-store/name/a%2Fb%3Fc%23d',
        'GET /api/v1/secure-store/name/..%252F..',
      ]);
    });

    it('should refuse a secure store name of ..', async () => {
      await refuses(() => instance.SecureStore.findByName('..'));

      assert.strictEqual(server.requests.length, 0);
    });

    it('should encode a lambda id', async () => {
      await instance.Lambda.editLambdaDeployment('a?b', {branch: 'main'});
      await instance.Lambda.setPolicyProperty('a#b', {role: 'admin'});
      await instance.Lambda.scheduleExecution('../app', '2026-10-06T00:00:00.000Z', []);
      await instance.Lambda.clearPolicyProperty('a/b');

      assert.deepStrictEqual(sent(), [
        'PUT /api/v1/lambda/a%3Fb/deployment',
        'PUT /api/v1/lambda/a%23b/policy-property',
        'POST /api/v1/lambda/..%2Fapp/schedule',
        'PUT /api/v1/lambda/a%2Fb/clear-policy-property',
      ]);
    });

    it('should refuse a lambda id of . or ..', async () => {
      await refuses(() => instance.Lambda.editLambdaDeployment('..', {branch: 'main'}));
      await refuses(() => instance.Lambda.updatePolicyProperty('.', {role: 'admin'}));
      await refuses(() => instance.Lambda.scheduleExecution('..', '2026-10-06T00:00:00.000Z', []));

      assert.strictEqual(server.requests.length, 0);
    });

    it('should encode a data sharing id', async () => {
      await instance.AppDataSharing.updateDataSharingPolicy('../x', {policy: []});
      await instance.AppDataSharing.reactivate('a#b');
      await instance.AppDataSharing.deactivate('a?b');

      assert.deepStrictEqual(sent(), [
        'PUT /api/v1/app-data-sharing/..%2Fx/policy',
        'PUT /api/v1/app-data-sharing/reactivate/a%23b',
        'PUT /api/v1/app-data-sharing/deactivate/a%3Fb',
      ]);
    });

    it('should refuse a data sharing id of . or ..', async () => {
      await refuses(() => instance.AppDataSharing.updateDataSharingPolicy('..', {policy: []}));
      await refuses(() => instance.AppDataSharing.reactivate('..'));
      await refuses(() => instance.AppDataSharing.deactivate('.'));

      assert.strictEqual(server.requests.length, 0);
    });

    it('should encode an app id or api path in a policy property list path', async () => {
      await instance.App.getPolicyPropertiesList('../user');
      await instance.App.setPolicyPropertyList({role: ['admin']}, 'a/b' as unknown as null);

      assert.deepStrictEqual(sent(), [
        'GET /api/v1/app/policy-property-list/..%2Fuser',
        'PUT /api/v1/app/policy-property-list/false/a%2Fb',
      ]);
      await refuses(() => instance.App.getPolicyPropertiesList('..'));
      assert.strictEqual(server.requests.length, 2);
    });
  });
});

describe('Init', () => {
  it('should be able to init again after fetching the schema fails', async () => {
    const getSchema = App.prototype.getSchema;
    App.prototype.getSchema = () => Promise.reject(new Error('unreachable'));

    const instance = Buttress.new();
    try {
      await assert.rejects(
        instance.init(options({buttressUrl: 'http://127.0.0.1:1', appToken: 'APP_TOKEN', apiPath: 'test-app'})),
        /unreachable/,
      );
      assert.strictEqual(instance.initialised, false);
      assert.throws(() => instance.App, Errors.NotYetInitiated);

      App.prototype.getSchema = () => Promise.resolve(schema);
      await instance.init(options({buttressUrl: 'http://127.0.0.1:1', appToken: 'APP_TOKEN', apiPath: 'test-app'}));

      assert.strictEqual(instance.initialised, true);
      assert(instance.getCollection('thing'));
    } finally {
      App.prototype.getSchema = getSchema;
    }
  });
});

describe('Core modules', () => {
  const coreModules = {
    App: 'app',
    Auth: 'auth',
    Lambda: 'lambda',
    Policy: 'policy',
    Token: 'token',
    User: 'user',
    SecureStore: 'secureStore',
    AppDataSharing: 'appDataSharing',
    LambdaExecution: 'lambdaExecution',
  };

  it('should throw NotYetInitiated when used before init', async () => {
    const instance = Buttress.new();

    for (const name of Object.keys(coreModules)) {
      assert.throws(
        () => instance[name as keyof typeof coreModules],
        (err: unknown) => err instanceof Errors.NotYetInitiated && err.message.includes(name),
      );
    }
    await assert.rejects(
      instance.createUserTransientPolicy('USER', 'TOKEN', {name: 'p'} as Policy),
      Errors.NotYetInitiated,
    );
  });

  it('should be the same instances as getCollection', async () => {
    const instance = Buttress.new();
    await instance.init(
      options({
        buttressUrl: 'http://127.0.0.1:1',
        appToken: 'APP_TOKEN',
        apiPath: 'test-app',
        schema,
        useLocalSchema: true,
      }),
    );

    for (const [name, collection] of Object.entries(coreModules)) {
      assert.strictEqual(instance[name as keyof typeof coreModules], instance.getCollection(collection), name);
    }
  });

  it('should throw NotYetInitiated again after clean', async () => {
    const instance = Buttress.new();
    await instance.init(
      options({
        buttressUrl: 'http://127.0.0.1:1',
        appToken: 'APP_TOKEN',
        apiPath: 'test-app',
        schema,
        useLocalSchema: true,
      }),
    );
    instance.clean();

    for (const name of Object.keys(coreModules)) {
      assert.throws(() => instance[name as keyof typeof coreModules], Errors.NotYetInitiated);
    }
  });
});

describe('Clean and init', () => {
  let server: TestServer;

  const appOptions = (appToken: string, apiPath: string, extra: Record<string, unknown> = {}) =>
    options({buttressUrl: server.url, appToken, apiPath, schema, useLocalSchema: true, ...extra});

  before(async () => {
    server = await startServer();
  });

  beforeEach(() => {
    server.requests.length = 0;
    server.reply = () => ({status: 200, body: {}});
  });

  after(() => server.close());

  it('should refuse a module taken before clean rather than use the old app', async () => {
    const instance = Buttress.new();
    await instance.init(appOptions('OLD_TOKEN', 'old-app'));
    const oldThing = instance.getCollection('thing');
    const oldUser = instance.User;

    instance.clean();
    await instance.init(appOptions('NEW_TOKEN', 'new-app'));

    await assert.rejects(oldThing.getAll(), Errors.NotYetInitiated);
    await assert.rejects(oldUser.getUser('U1'), Errors.NotYetInitiated);
    assert.throws(() => oldThing.createObject(), /after Buttress.clean\(\)/);
    assert.strictEqual(server.requests.length, 0);

    // A module taken after init uses the new app
    await instance.getCollection('thing').getAll();
    assert.strictEqual(server.requests[0].url, '/new-app/api/v1/thing');
    assert.strictEqual(server.requests[0].headers['authorization'], 'Bearer NEW_TOKEN');
  });
});
