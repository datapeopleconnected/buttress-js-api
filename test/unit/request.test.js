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

const assert = require('assert');
const http = require('http');

const {default: Buttress, Errors} = require('../../dist/index');
const App = require('../../dist/app').default;

const schema = [{name: 'thing', type: 'collection', properties: {name: {__type: 'string'}}}];

/**
 * A stand-in for buttress which records each request and replies with whatever `reply` returns.
 */
const startServer = async () => {
  const state = {requests: [], reply: () => ({status: 200, body: {}})};

  const server = http.createServer((req, res) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      const request = {
        method: req.method,
        url: req.url,
        headers: req.headers,
        raw,
        body: raw ? JSON.parse(raw) : undefined,
      };
      state.requests.push(request);

      const reply = state.reply(request, state.requests.length);
      if (reply.destroy) return req.socket.destroy();

      res.writeHead(reply.status, {'Content-Type': 'application/json'});
      res.end(JSON.stringify(reply.body));
    });
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  state.url = `http://127.0.0.1:${server.address().port}`;
  state.close = () => new Promise((resolve) => server.close(resolve));
  return state;
};

describe('Requests', () => {
  let server;
  let instance;

  before(async () => {
    server = await startServer();
    instance = Buttress.new();
    await instance.init({
      buttressUrl: server.url,
      appToken: 'APP_TOKEN',
      apiPath: 'test-app',
      schema,
      useLocalSchema: true,
      clientSessionId: '4f7b2b9e-6c1a-4a5e-9d3b-2f6f0c8a1e11',
    });
  });

  beforeEach(() => {
    server.requests.length = 0;
    server.reply = () => ({status: 200, body: {}});
  });

  after(() => server.close());

  it('should surface the message from a buttress error body', async () => {
    server.reply = () => ({status: 401, body: {statusMessage: 'invalid_token', message: 'invalid_token'}});

    await assert.rejects(instance.getCollection('thing').getAll(), (err) => {
      assert(err instanceof Errors.ResponseError);
      assert.strictEqual(err.statusCode, 401);
      assert.strictEqual(err.statusMessage, 'Unauthorized');
      assert.strictEqual(err.message, 'invalid_token');
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
    server.reply = (req, count) => (count === 1 ? {destroy: true} : {status: 200, body: [{id: '1'}]});

    const res = await instance.getCollection('thing').getAll();

    assert.deepStrictEqual(res, [{id: '1'}]);
    assert.strictEqual(server.requests.length, 2);
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
    assert.throws(() => instance.getCollection('thing').removeAll({name: 'x'}), /bulkRemove/);
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

  it('should set policy properties on the token of an existing user', async () => {
    server.reply = (req) =>
      req.method === 'GET'
        ? {status: 200, body: {id: 'USER_ID', auth: [], tokens: [{value: 'TOKEN_VALUE', policyProperties: null}]}}
        : {status: 200, body: true};

    const user = await instance.Auth.findOrCreateUser(
      {app: 'google', appId: 'G1', policyProperties: {role: 'user'}},
      {domains: []},
    );

    assert.deepStrictEqual(
      server.requests.map((r) => `${r.method} ${r.url}`),
      ['GET /api/v1/user/google/G1', 'PUT /api/v1/user/USER_ID/policy-property/TOKEN_VALUE'],
    );
    assert.deepStrictEqual(user.tokens[0].policyProperties, {role: 'user'});
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
    assert.deepStrictEqual(post.body.token, {domains: [], policyProperties: {role: 'user'}});
    assert.strictEqual(server.requests.length, 2);
  });
});

describe('Init', () => {
  it('should be able to init again after fetching the schema fails', async () => {
    const getSchema = App.prototype.getSchema;
    App.prototype.getSchema = () => Promise.reject(new Error('unreachable'));

    const instance = Buttress.new();
    try {
      await assert.rejects(
        instance.init({buttressUrl: 'http://127.0.0.1:1', appToken: 'APP_TOKEN', apiPath: 'test-app'}),
        /unreachable/,
      );
      assert.strictEqual(instance.initialised, false);
      assert.throws(() => instance.App, Errors.NotYetInitiated);

      App.prototype.getSchema = () => Promise.resolve(schema);
      await instance.init({buttressUrl: 'http://127.0.0.1:1', appToken: 'APP_TOKEN', apiPath: 'test-app'});

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
        () => instance[name],
        (err) => err instanceof Errors.NotYetInitiated && err.message.includes(name),
      );
    }
    await assert.rejects(instance.createUserTransientPolicy('USER', 'TOKEN', {name: 'p'}), Errors.NotYetInitiated);
  });

  it('should be the same instances as getCollection', async () => {
    const instance = Buttress.new();
    await instance.init({
      buttressUrl: 'http://127.0.0.1:1',
      appToken: 'APP_TOKEN',
      apiPath: 'test-app',
      schema,
      useLocalSchema: true,
    });

    for (const [name, collection] of Object.entries(coreModules)) {
      assert.strictEqual(instance[name], instance.getCollection(collection), name);
    }
  });

  it('should throw NotYetInitiated again after clean', async () => {
    const instance = Buttress.new();
    await instance.init({
      buttressUrl: 'http://127.0.0.1:1',
      appToken: 'APP_TOKEN',
      apiPath: 'test-app',
      schema,
      useLocalSchema: true,
    });
    instance.clean();

    for (const name of Object.keys(coreModules)) {
      assert.throws(() => instance[name], Errors.NotYetInitiated);
    }
  });
});
