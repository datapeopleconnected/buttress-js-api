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
  // Sent as it is instead of body, for JSON that an object can't be stringified to
  raw?: string;
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
      res.end(reply.raw ?? JSON.stringify(reply.body));
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

  it('should leave out a null or undefined query param', async () => {
    await instance.getCollection('thing').getAll({params: {a: null, b: undefined, c: 'x'}});
    await instance.getCollection('thing').getAll({params: {a: null}});

    assert.strictEqual(server.requests[0].url, '/test-app/api/v1/thing?c=x');
    assert.strictEqual(server.requests[1].url, '/test-app/api/v1/thing');
  });

  it('should send numbers and booleans as text', async () => {
    await instance.getCollection('thing').getAll({params: {limit: 0, raw: false}});

    assert.strictEqual(server.requests[0].url, '/test-app/api/v1/thing?limit=0&raw=false');
  });

  it('should send an array query param as a comma-separated list, as Buttress reads ids=a,b', async () => {
    await instance.getCollection('thing').getAll({params: {ids: ['a', 'b c', 1]}});
    await instance.getCollection('thing').getAll({params: {ids: [], c: 'x'}});

    assert.strictEqual(server.requests[0].url, '/test-app/api/v1/thing?ids=a,b%20c,1');
    assert.strictEqual(server.requests[1].url, '/test-app/api/v1/thing?c=x');
  });

  it('should refuse an object query param, or a list item holding a comma', async () => {
    const thing = instance.getCollection('thing');
    await assert.rejects(thing.getAll({params: {q: {name: 'x'}}}), /Unable to send the query param 'q'/);
    await assert.rejects(thing.getAll({params: {ids: [{id: 'a'}]}}), /Unable to send the query param 'ids'/);
    await assert.rejects(thing.getAll({params: {ids: ['a,b']}}), /splits a list on commas/);
    assert.strictEqual(server.requests.length, 0);
  });

  it('should spot a POST redirected to https whatever the case of the host or a default port', async () => {
    const thing = instance.getCollection('thing');
    const redirected = (url: string, responseUrl: string) => thing._postRedirect({url: responseUrl} as Response, url);

    assert.strictEqual(
      redirected('http://buttress.example/a/api/v1/thing', 'https://buttress.example/a/api/v1/thing'),
      true,
    );
    assert.strictEqual(
      redirected('http://Buttress.Example/a/api/v1/thing', 'https://buttress.example/a/api/v1/thing'),
      true,
    );
    assert.strictEqual(
      redirected('http://buttress.example:80/a/api/v1/thing', 'https://buttress.example/a/api/v1/thing'),
      true,
    );
    assert.strictEqual(redirected('http://buttress.example/a?x=1', 'https://buttress.example/a?x=1'), true);

    // Not a redirect between protocols of the same URL
    assert.strictEqual(
      redirected('https://buttress.example/a/api/v1/thing', 'https://buttress.example/a/api/v1/thing'),
      false,
    );
    assert.strictEqual(
      redirected('http://buttress.example/a/api/v1/thing', 'https://other.example/a/api/v1/thing'),
      false,
    );
    assert.strictEqual(redirected('http://buttress.example:8080/a', 'https://buttress.example/a'), false);
  });

  it('should re-send a redirected POST to https without an http default port', async () => {
    const thing = instance.getCollection('thing') as unknown as {__toHttps(url: string): string};

    assert.strictEqual(
      thing.__toHttps('http://Buttress.example:80/a/api/v1/thing'),
      'https://buttress.example/a/api/v1/thing',
    );
    assert.strictEqual(
      thing.__toHttps('http://buttress.example:8080/a?ids=a,b'),
      'https://buttress.example:8080/a?ids=a,b',
    );
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

  it('should merge a partner item with a __proto__ key without changing its prototype', async () => {
    server.reply = () => ({
      status: 200,
      raw: '[{"id":"1","sourceId":"a","name":"x"},{"id":"1","sourceId":"a","__proto__":{"isAdmin":true},"age":2}]',
    });

    const [item] = await instance.getCollection('thing').getAll();

    assert.strictEqual(Object.getPrototypeOf(item), Object.prototype);
    assert.strictEqual(item.isAdmin, undefined);
    assert.deepStrictEqual(Object.getOwnPropertyDescriptor(item, '__proto__')?.value, {isAdmin: true});
    assert.strictEqual(item.name, 'x');
    assert.strictEqual(item.age, 2);
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

  it('should send a per-call token instead of the instance token', async () => {
    await instance.getCollection('thing').getAll({token: 'USER_TOKEN'});

    assert.strictEqual(server.requests[0].headers['authorization'], 'Bearer USER_TOKEN');
  });

  it('should refuse an empty per-call token rather than fall back to the instance token', async () => {
    for (const token of ['', null, undefined]) {
      await assert.rejects(
        instance.getCollection('thing').getAll({token: token as string}),
        /The token passed in the options is/,
      );
      await assert.rejects(instance.User.getUser('U1', {token: token as string}), /token option/);
    }
    assert.strictEqual(server.requests.length, 0);
  });

  it('should make calls that pass their own token on a client without an app token', async () => {
    const noAppToken = Buttress.new();
    await noAppToken.init(options({buttressUrl: server.url, apiPath: 'test-app', schema, useLocalSchema: true}));

    await noAppToken.getCollection('thing').getAll({token: 'USER_TOKEN'});
    await noAppToken.AppDataSharing.activate('REGISTRATION_TOKEN', 'NEW_TOKEN');

    assert.deepStrictEqual(
      server.requests.map((r) => `${r.method} ${r.url} ${r.headers['authorization']}`),
      [
        'GET /test-app/api/v1/thing Bearer USER_TOKEN',
        'POST /api/v1/app-data-sharing/activate Bearer REGISTRATION_TOKEN',
      ],
    );

    // A call without its own token still needs the app token
    await assert.rejects(noAppToken.getCollection('thing').getAll(), /No default token provided/);
    await assert.rejects(noAppToken.AppDataSharing.activate('', 'NEW_TOKEN'), /token option/);
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
    await assert.rejects(instance.getCollection('thing').removeAll({name: 'x'} as unknown as null), /bulkRemove/);
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

  describe('A user created since it was looked up', () => {
    const userBody = {
      id: 'USER_ID',
      auth: [],
      tokens: [{id: 'TOKEN_ID', value: 'TOKEN_VALUE', policyProperties: null}],
    };
    // Buttress's answer to a user whose auth entry another user already has
    const alreadyExists = {
      status: 400,
      body: {code: 'user_already_exists_with_that_name', message: 'User already exists with that name'},
    };
    const sent = () => server.requests.map((r) => `${r.method} ${r.url}`);

    it('should find the user another call created when Buttress refuses to create it again', async () => {
      let lookups = 0;
      server.reply = (req) => {
        if (req.method === 'GET')
          return ++lookups === 1 ? {status: 404, body: {code: 'user_not_found'}} : {status: 200, body: userBody};
        return alreadyExists;
      };

      const user = await instance.Auth.findOrCreateUser({app: 'google', appId: 'G1'}, {domains: []});

      assert.strictEqual(user.id, 'USER_ID');
      assert.deepStrictEqual(sent(), ['GET /api/v1/user/google/G1', 'POST /api/v1/user', 'GET /api/v1/user/google/G1']);
    });

    it('should give both of two simultaneous first logins the one user', async () => {
      let created = false;
      server.reply = (req) => {
        if (req.method === 'GET')
          return created ? {status: 200, body: userBody} : {status: 404, body: {code: 'user_not_found'}};
        if (created) return alreadyExists;
        created = true;
        return {status: 200, body: userBody};
      };

      const users = await Promise.all([
        instance.Auth.findOrCreateUser({app: 'google', appId: 'G1'}, {domains: []}),
        instance.Auth.findOrCreateUser({app: 'google', appId: 'G1'}, {domains: []}),
      ]);

      assert.deepStrictEqual(
        users.map((u) => u.id),
        ['USER_ID', 'USER_ID'],
      );
      assert.strictEqual(server.requests.filter((r) => r.method === 'POST').length, 2);
    });

    it('should throw the refusal when the user still is not found, as another user has its email', async () => {
      server.reply = (req) => (req.method === 'GET' ? {status: 404, body: {code: 'user_not_found'}} : alreadyExists);

      await assert.rejects(
        instance.Auth.findOrCreateUser({app: 'google', appId: 'G1', email: 'a@example.com'}, {domains: []}),
        (err: unknown) => err instanceof Errors.ResponseError && err.errorCode === 'user_already_exists_with_that_name',
      );
      assert.deepStrictEqual(sent(), ['GET /api/v1/user/google/G1', 'POST /api/v1/user', 'GET /api/v1/user/google/G1']);
    });

    it('should throw any other refusal to create the user without looking it up again', async () => {
      server.reply = (req) =>
        req.method === 'GET'
          ? {status: 404, body: {code: 'user_not_found'}}
          : {status: 400, body: {code: 'invalid_domains', message: 'Invalid domains'}};

      await assert.rejects(
        instance.Auth.findOrCreateUser({app: 'google', appId: 'G1'}, {domains: []}),
        (err: unknown) => err instanceof Errors.ResponseError && err.errorCode === 'invalid_domains',
      );
      assert.deepStrictEqual(sent(), ['GET /api/v1/user/google/G1', 'POST /api/v1/user']);
    });
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

    it('should write a key as a single property of storeData', async () => {
      const store = await instance.SecureStore.findByName('store');
      server.requests.length = 0;

      await store.setValue('apiKey', 'x');

      assert.strictEqual(server.requests[0].url, '/api/v1/secure-store/1');
      assert.deepStrictEqual(server.requests[0].body, [{path: 'storeData.apiKey', value: 'x'}]);
    });

    it('should refuse a key holding a . or an empty key, both to write and to read', async () => {
      server.reply = () => ({status: 200, body: {id: '1', name: 'store', storeData: {'a.b': 1}}});
      const store = await instance.SecureStore.findByName('store');
      server.requests.length = 0;

      // A write to a.b would set storeData.a.b, which a read of a.b can't find
      await assert.rejects(store.setValue('a.b', 'x'), /Unable to use 'a.b' as a secure store key/);
      await assert.rejects(store.setValue('', 'x'), /secure store key/);
      assert.throws(() => store.getValue('a.b'), /Unable to use 'a.b' as a secure store key/);
      assert.strictEqual(server.requests.length, 0);
    });
  });

  describe('Transient policies', () => {
    it('should create the policy marked transient, and give the token the property named after it', async () => {
      const policy: Policy = {name: 'examAccess', version: '1', selection: {examAccess: {'@eq': true}}, config: []};

      await instance.createUserTransientPolicy('U1', 'T1', policy);

      assert.strictEqual(server.requests[0].url, '/api/v1/policy');
      assert.deepStrictEqual(server.requests[0].body, {...policy, transient: true});
      assert.strictEqual(server.requests[1].url, '/api/v1/user/U1/update-policy-property/T1');
      assert.deepStrictEqual(server.requests[1].body, {examAccess: true});
      assert.strictEqual(policy.transient, undefined, "the caller's policy is left as it was");
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
    // Refused through the call's promise, a call that throws instead fails the test
    const refuses = async (call: () => Promise<unknown>) => {
      await assert.rejects(call(), /path segment/);
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
      await instance.AppDataSharing.updateDataSharingPolicy('../x', [{verbs: ['GET'], schema: ['car']}]);
      await instance.AppDataSharing.reactivate('a#b');
      await instance.AppDataSharing.deactivate('a?b');

      assert.deepStrictEqual(sent(), [
        'PUT /api/v1/app-data-sharing/..%2Fx/policy',
        'PUT /api/v1/app-data-sharing/reactivate/a%23b',
        'PUT /api/v1/app-data-sharing/deactivate/a%3Fb',
      ]);
    });

    it('should refuse a data sharing id of . or ..', async () => {
      await refuses(() => instance.AppDataSharing.updateDataSharingPolicy('..', [{verbs: ['GET'], schema: ['car']}]));
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

  describe('Errors before the request', () => {
    // Calls the method and checks it returned a promise, which rejects, rather than throwing
    const rejectsWithoutThrowing = async (call: () => unknown, expected: RegExp | (new (m: string) => Error)) => {
      let promise: unknown;
      assert.doesNotThrow(() => {
        promise = call();
      }, 'the call threw instead of rejecting its promise');
      assert(promise instanceof Promise, 'the call did not return a promise');
      await assert.rejects(promise, expected);
    };

    it('should reject an empty per-call token, so .catch() handles it', async () => {
      let caught: unknown;
      await instance
        .getCollection('thing')
        .get('ID', {token: ''})
        .catch((err: unknown) => {
          caught = err;
        });

      assert.match(String(caught), /The token passed in the options is empty/);
      assert.strictEqual(server.requests.length, 0);
    });

    it('should reject a missing app token, a removeAll filter and a refused id through the promise', async () => {
      const noAppToken = Buttress.new();
      await noAppToken.init(options({buttressUrl: server.url, apiPath: 'test-app', schema, useLocalSchema: true}));

      await rejectsWithoutThrowing(() => noAppToken.getCollection('thing').get('ID'), /No default token provided/);
      await rejectsWithoutThrowing(() => noAppToken.User.getUser('U1'), /No default token provided/);
      await rejectsWithoutThrowing(
        () => instance.getCollection('thing').removeAll({name: 'x'} as unknown as null),
        /bulkRemove/,
      );
      await rejectsWithoutThrowing(() => instance.Lambda.setPolicyProperty('..', {}), /path segment/);
      await rejectsWithoutThrowing(() => noAppToken.Policy.createPolicy({name: 'p'} as Policy), /No default token/);
      assert.strictEqual(server.requests.length, 0);
    });

    it('should reject NotYetInitiated from a module taken before clean', async () => {
      const cleaned = Buttress.new();
      await cleaned.init(
        options({buttressUrl: server.url, appToken: 'APP_TOKEN', apiPath: 'test-app', schema, useLocalSchema: true}),
      );
      const thing = cleaned.getCollection('thing');
      const user = cleaned.User;
      cleaned.clean();

      await rejectsWithoutThrowing(() => thing.get('ID'), Errors.NotYetInitiated);
      await rejectsWithoutThrowing(() => thing.save({}), Errors.NotYetInitiated);
      await rejectsWithoutThrowing(() => user.findUser('google', 'G1'), Errors.NotYetInitiated);
      assert.strictEqual(server.requests.length, 0);
    });

    it('should reject rather than throw from every request method of every module', async () => {
      // A client without an app token, so every call is refused before anything is sent
      const noAppToken = Buttress.new();
      await noAppToken.init(options({buttressUrl: server.url, apiPath: 'test-app', schema, useLocalSchema: true}));

      // Methods that don't make a request and return their result straight away
      const notRequests = ['constructor', 'getEndpoint', 'loadSchema', 'createObject'];

      const modules: Record<string, object> = {
        thing: noAppToken.getCollection('thing'),
        App: noAppToken.App,
        Auth: noAppToken.Auth,
        Lambda: noAppToken.Lambda,
        Policy: noAppToken.Policy,
        Token: noAppToken.Token,
        User: noAppToken.User,
        SecureStore: noAppToken.SecureStore,
        AppDataSharing: noAppToken.AppDataSharing,
        LambdaExecution: noAppToken.LambdaExecution,
      };

      const checked: string[] = [];
      const failures: string[] = [];
      for (const [name, mod] of Object.entries(modules)) {
        const methods = new Set<string>();
        for (
          let proto = Object.getPrototypeOf(mod);
          proto && proto !== Object.prototype;
          proto = Object.getPrototypeOf(proto)
        ) {
          for (const key of Object.getOwnPropertyNames(proto)) {
            const descriptor = Object.getOwnPropertyDescriptor(proto, key);
            if (typeof descriptor?.value !== 'function' || key.startsWith('_') || notRequests.includes(key)) continue;
            methods.add(key);
          }
        }

        for (const method of methods) {
          checked.push(`${name}.${method}`);
          let result: unknown;
          try {
            result = (mod as Record<string, () => unknown>)[method]();
          } catch (err) {
            failures.push(`${name}.${method} threw ${String(err)}`);
            continue;
          }
          if (!(result instanceof Promise)) {
            failures.push(`${name}.${method} returned ${String(result)}`);
            continue;
          }
          if (
            await result.then(
              () => true,
              () => false,
            )
          )
            failures.push(`${name}.${method} resolved`);
        }
      }

      assert.deepStrictEqual(failures, []);
      // Make sure the walk found the methods
      for (const method of [
        'thing.get',
        'thing.removeAll',
        'User.findUser',
        'Auth.findOrCreateUser',
        'App.getSchema',
      ]) {
        assert(checked.includes(method), `${method} was not checked`);
      }
      assert.strictEqual(server.requests.length, 0);
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

  it('should refuse an init with different options rather than ignore it', async () => {
    const instance = Buttress.new();
    await instance.init(appOptions('OLD_TOKEN', 'old-app'));

    await assert.rejects(
      instance.init(appOptions('NEW_TOKEN', 'old-app')),
      /already initialised with different options/,
    );
    await assert.rejects(
      instance.init(appOptions('OLD_TOKEN', 'new-app')),
      /already initialised with different options/,
    );
    await assert.rejects(instance.init(appOptions('OLD_TOKEN', 'old-app'), true), /different options/);

    // The client is left as it was
    await instance.getCollection('thing').getAll();
    assert.strictEqual(server.requests[0].url, '/old-app/api/v1/thing');
    assert.strictEqual(server.requests[0].headers['authorization'], 'Bearer OLD_TOKEN');
  });

  it('should resolve an init with the same options as before', async () => {
    const instance = Buttress.new();
    await instance.init(appOptions('APP_TOKEN', 'test-app', {maxRetries: 2}));

    // A fresh but equal options object, with a property left undefined, is the same
    await instance.init(appOptions('APP_TOKEN', 'test-app', {maxRetries: 2, clientSessionId: undefined}));
    assert.strictEqual(instance.initialised, true);
  });

  it('should warn that allowUnauthorized is ignored, as certificates are always verified', async () => {
    const warn = console.warn;
    const warnings: string[] = [];
    console.warn = (message: string) => warnings.push(message);

    try {
      await Buttress.new().init(appOptions('APP_TOKEN', 'test-app', {allowUnauthorized: false}));
      assert.deepStrictEqual(warnings, []);

      await Buttress.new().init(appOptions('APP_TOKEN', 'test-app', {allowUnauthorized: true}));
      assert.strictEqual(warnings.length, 1);
      assert.match(warnings[0], /allowUnauthorized is ignored, certificates are always verified/);
    } finally {
      console.warn = warn;
    }
  });

  it('should make a second init wait for the first to load the schema', async () => {
    const getSchema = App.prototype.getSchema;
    let release = () => {};
    App.prototype.getSchema = () =>
      new Promise((resolve) => {
        release = () => resolve(schema);
      });

    try {
      const instance = Buttress.new();
      const fetched = options({buttressUrl: server.url, appToken: 'APP_TOKEN', apiPath: 'test-app'});
      const first = instance.init(fetched);
      let secondDone = false;
      const second = instance.init(fetched).then((res) => {
        secondDone = true;
        return res;
      });

      await new Promise((resolve) => setTimeout(resolve, 20));
      assert.strictEqual(secondDone, false, 'the second init returned before the schema loaded');

      release();
      assert.strictEqual(await second, await first);
      assert(instance.getCollection('thing'));
    } finally {
      App.prototype.getSchema = getSchema;
    }
  });
});
