# Migration guide

Which section you need depends on the version you're moving from:

- **2.x** (`buttress-js-api`, the last release was 2.5.2): [Migrating from 2.x to 3.0.0](#migrating-from-2x-to-300)
- **3.0.0-53 to 3.0.0-62**: [Migrating from a 3.0.0 pre-release](#migrating-from-a-300-pre-release)
- **3.0.0-52 or earlier**: [Migrating from 3.0.0-52 to 3.0.0-53](#migrating-from-300-52-to-300-53), then
  [Migrating from a 3.0.0 pre-release](#migrating-from-a-300-pre-release)

## Migrating from 2.x to 3.0.0

3.0.0 is a rewrite of the client in TypeScript, for the Buttress 3 server. Buttress 3 replaces app roles with
policies, only reads tokens from the `Authorization` header, and answers searches sent with the HTTP `QUERY` method.
The client follows it, so most code that uses collections keeps working, but setup, authentication and a few core
module calls change.

### Checklist

- [ ] Upgrade the Buttress server to 3.0.0 or later at the same time ([details](#upgrade-the-server-and-client-together))
- [ ] Move to Node.js 22 or later
- [ ] Install `@buttress/api` instead of `buttress-js-api`, and import its default export ([details](#the-package-is-now-buttressapi))
- [ ] Remove the `roles` and `allowUnauthorized` init options ([details](#init))
- [ ] Get collections by the schema's `name`, not its `collection` ([details](#collections-are-named-by-the-schemas-name))
- [ ] Pass tokens as `{token}`, not `{params: {token}}` ([details](#tokens-go-in-the-authorization-header))
- [ ] Only pass the request options the client supports ([details](#request-options))
- [ ] Update calls to `App.getSchema`, `App.updateRoles`, `Auth`, `User.findUser` and `Token.updateRole` ([details](#core-modules))
- [ ] Stop passing a filter to `removeAll` ([details](#removeall-no-longer-accepts-a-filter))
- [ ] Check code that reads errors from failed requests ([details](#errors))

### Upgrade the server and client together

The 2.x client doesn't work with a Buttress 3 server, and 3.0.0 doesn't work with a Buttress 2 server:

- 2.x sends its token in the query string (`?token=`), which Buttress 3 refuses.
- 3.0.0 sends `search`, `count` and `bulkGet` with the HTTP `QUERY` method, which Buttress 2 answers with 404.

Buttress 3 also has no app roles, so a 2.x app's roles need rewriting as policies (see [`roles`](#init) below).

### The package is now `@buttress/api`

```sh
npm uninstall buttress-js-api
npm install @buttress/api
```

The client is the package's default export. It's built as CommonJS, so `require` needs `.default`:

```js
// Before
const Buttress = require('buttress-js-api');

// After
import Buttress from '@buttress/api';
// or
const Buttress = require('@buttress/api').default;
```

The package is licensed under the **AGPL-3.0-or-later**, not MIT as 2.x was. Check that this suits your project
before upgrading.

It no longer depends on `axios` or `mongodb`. Requests are made with `fetch`, and ids are generated with
`bson-objectid`.

### `init`

| Option              | 2.x                                  | 3.0.0                                                                                                                                                                  |
| ------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `roles`             | Sent to Buttress with `update: true` | Removed. Buttress 3 controls access with policies: create them with `Buttress.Policy.createPolicy`, or keep an app's set in step with `Buttress.Policy.syncAppPolicy`. |
| `allowUnauthorized` | Turned off TLS certificate checks    | Ignored, with a warning. Certificates are always checked. For a self-signed certificate, add it to the ones Node trusts with `NODE_EXTRA_CA_CERTS`.                    |
| `version`           | Required                             | Optional, defaults to `1`                                                                                                                                              |
| `appToken`          | Required                             | Optional. Without one, every call has to pass its own `token`.                                                                                                         |

`init()` can still only set up one app per instance, but a second call no longer quietly does nothing. With the same
options it resolves to the first call's result. With different options it rejects with "Buttress is already
initialised with different options". To switch apps, call `Buttress.clean()` first, or create a separate instance with
`Buttress.new()`.

### Collections are named by the schema's `name`

2.x looked a collection up by its schema's `collection` (usually plural). 3.0.0 looks it up by the schema's `name`,
which has to be camelCase:

```js
// Before
Buttress.getCollection('companies');

// After
Buttress.getCollection('company');
```

2.x also added a property to the instance for every collection, such as `Buttress.Companies`. 3.0.0 only has
properties for its core modules (`App`, `Auth`, `Lambda`, `LambdaExecution`, `Policy`, `Token`, `User`, `SecureStore`
and `AppDataSharing`), so use `getCollection` for your own collections.

The core modules are read-only. Using one before `init()` or after `clean()` throws `Errors.NotYetInitiated`, as does
using a collection module you got before `clean()`.

### Tokens go in the `Authorization` header

Pass a token for a single call as the `token` option. The client sends it in the `Authorization` header.

```js
// Before
await Buttress.getCollection('posts').getAll({params: {token}});

// After
await Buttress.getCollection('post').getAll({token});
```

A `token` option that's empty (`''`, `null` or `undefined`) throws rather than falling back to the app token, so a
user token that failed to load can't send the request with the app's privileges. Leave the option out to use the app
token.

Use `Buttress.setAuthToken(token)` to change the token the instance sends.

Sockets connect with `io.connect(url, {auth: {token}})` instead of `{query: 'token=...'}`.

### Request options

2.x passed the options object straight to axios, so any axios option worked. 3.0.0 makes its requests with `fetch`, and
reads only these options:

| Option           | Used for                                                                                  |
| ---------------- | ----------------------------------------------------------------------------------------- |
| `token`          | The token for this call                                                                   |
| `headers`        | Extra request headers                                                                     |
| `params`         | Query string parameters. An array is sent as one comma-separated value.                   |
| `data`           | Fields added to the request body. Most methods set the body themselves, replacing these.  |
| `project`        | `search`: the properties to return, as `{content: 1}`                                     |
| `stream`         | `getAll` and `search`: resolve to a Node `Readable` of the response body                  |
| `combineResults` | Merge results from data sharing partners into one list. Defaults to `true`.               |
| `sourceId`       | `update`: update an entity held by a data sharing partner                                 |
| `actualCount`    | `count`: add up a count per matching policy, rather than counting the combined query once |

There's no request timeout option.

### Core modules

| 2.x                                   | 3.0.0                                                                                                                           |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `App.getSchema(options)`              | `App.getSchema(rawSchema, options)`. Pass `false` first if you pass options: options passed first would be read as `rawSchema`. |
| `App.updateRoles(roles)`              | Removed, with app roles. Use policies.                                                                                          |
| `Auth.findOrCreateUser(user, auth)`   | Takes `{app, appId, ...}` rather than `{app, id, ...}`. See below.                                                              |
| `Auth.addAuthToUser(userId, appAuth)` | Removed. Buttress has no route for it.                                                                                          |
| `User.findUser(app, appUserId)`       | Rejects with a `ResponseError` with status 404 when there's no such user, rather than resolving to `false`.                     |
| `Token.updateRole(details)`           | Removed, with app roles.                                                                                                        |

`findOrCreateUser` takes the user's id with their auth provider as `appId`, and the token's details, such as its
`domains` and `policyProperties`, as the second argument:

```js
// Before
await Buttress.Auth.findOrCreateUser({app: 'google', id: profile.id, name, email}, {domains});

// After
await Buttress.Auth.findOrCreateUser({app: 'google', appId: profile.id, name, email}, {domains, policyProperties});
```

It resolves to the user with their `tokens`. Policy properties are held on a token, not the user, so read them from
`user.tokens[0].policyProperties`.

### `removeAll` no longer accepts a filter

Buttress's delete-all route ignores the request body and deletes every entity in the collection, so
`removeAll({status: 'draft'})` deleted everything. `removeAll` now rejects when it's given anything but `null` or
`undefined`. To delete some entities, find their ids and pass them to `bulkRemove`:

```js
const drafts = await Buttress.getCollection('post').search({status: {$eq: 'draft'}});
await Buttress.getCollection('post').bulkRemove(drafts.map((post) => post.id));
```

### Collection methods

The collection methods (`get`, `getAll`, `save`, `update`, `remove`, `search`, `count`, `bulkGet`, `bulkSave`,
`bulkRemove`) take the same arguments as in 2.x. The differences:

- `search`, `count` and `bulkGet` are sent with `QUERY` instead of `SEARCH` and `POST`. Policies treat `QUERY` and
  `SEARCH` as the same verb, so a policy that allows `SEARCH` also allows `QUERY`.
- `update` takes one `{path, value}` operation or an array of them, and resolves to the operations Buttress applied,
  not the updated entity.
- `count` can be called without a query, to count everything.
- New: `bulkUpdate` updates several entities in one request, and `getAll` and `search` take `stream: true`.
- `GET` and `QUERY` requests that never get a response are retried 10 times, with backoff. 2.x retried `GET`, `HEAD`
  and `OPTIONS` 9 times. Set `maxRetries` in the init options to change it; `0` turns retrying off. With the default,
  a request to a Buttress that stays unreachable takes about 7 minutes to fail.

### Errors

`Errors.ResponseError` and `Errors.RequestError` are still thrown for a failed request, and are also exported from
the package root as `Errors`. A `ResponseError` keeps `code`, `statusCode` and `statusMessage`, and adds:

| Property     | Holds                                                                                              |
| ------------ | -------------------------------------------------------------------------------------------------- |
| `errorCode`  | Buttress's code for what went wrong, such as `invalid_token` or `not_found`                        |
| `message`    | Buttress's description of the error, or the HTTP status text when the response doesn't include one |
| `httpStatus` | The HTTP status, as `code` and `statusCode` are                                                    |
| `retryable`  | Whether the same request might succeed later: `true` for 429, 500, 502, 503 and 504                |
| `body`       | The parsed error body, or `undefined` if it wasn't JSON                                            |

Buttress 3's messages are written for people and can change, so check `errorCode` or `statusCode` rather than
`message`:

```js
// Before
if (err.message === 'Unauthorized') { ... }

// After
if (err.statusCode === 401) { ... }
if (err.errorCode === 'invalid_token') { ... }
```

Calls reject their promise for errors found before a request is sent, such as a missing token, rather than throwing
where they're called.

### New in 3.0.0

- **TypeScript types.** Pass a type to `getCollection` to type a collection's entities and check its queries, for
  example `Buttress.getCollection<BaseSchema<Post>>('post')`. Queries use `$`-prefixed operators, such as
  `{kudos: {$gt: 5}}`.
- **Modules for Buttress 3's features:** `Policy`, `Lambda`, `LambdaExecution`, `SecureStore` and `AppDataSharing`,
  and policy properties on `User` and `App`.
- **More than one instance.** `Buttress.new()` returns a separate client, with its own app and token.
- **`clientSessionId`**, sent as `x-client-session-id` so a client can recognise its own changes when they come back
  over the socket.
- **`useLocalSchema`**, to build modules from a schema you pass rather than fetching it from Buttress.

## Migrating from a 3.0.0 pre-release

These changes since 3.0.0-53 need code changes. [changelog.md](changelog.md) lists everything else that changed.

- **Buttress 3.0.0 or later is needed.** `search`, `count` and `bulkGet` are sent with the HTTP `QUERY` method, which
  older servers answer with 404.
- **`init()` with different options rejects.** Calling `init()` again on an instance that's initialised, or still
  initialising, with different options rejects with "Buttress is already initialised with different options". It used
  to resolve and change nothing. Call `clean()` before `init()` to switch apps.
- **An empty `token` option throws.** A call given `token: ''`, `null` or `undefined` rejects instead of using the
  instance token. Leave the key out to use the instance token.
- **A module taken before `clean()` throws.** A module from `getCollection`, or a property such as `Buttress.User`, now
  throws `NotYetInitiated` when used after `clean()`, rather than going on with the old app's token and URLs. Get
  modules again after `init()`.
- **`AppDataSharing.updateDataSharingPolicy(id, policyConfig)` takes a list of policy configs**, as given when the
  agreement is created, and replaces the agreement's policy with them. Buttress refuses anything but a non-empty list
  with 400 `invalid_policy`.
- **Error messages are written for people.** Buttress now answers a failed request with `{code, message}`, so
  `err.message` is a description such as "No user has that auth app id", and the code (such as `not_found`) is in
  `err.errorCode`. Code that compared `err.message` to a code should compare `err.errorCode`.

## Migrating from 3.0.0-52 to 3.0.0-53

3.0.0-53 brings `@buttress/api` back in line with the current Buttress server. Several calls pointed at routes that don't exist, used the wrong HTTP verb, or authenticated in a way the server no longer accepts. Fixing them changes a few method signatures and the shape of errors.

### Checklist

- [ ] Pass a `tokenId` to the `User.*PolicyProperty` methods and the transient policy helpers ([details](#user-policy-properties-need-a-tokenid))
- [ ] Remove calls to `Token.updateRole` and `Auth.addAuthToUser` ([details](#removed-methods))
- [ ] Stop passing an argument to `removeAll` ([details](#removeall-no-longer-accepts-a-filter-1))
- [ ] Check any code that reads `err.message` from a failed request ([details](#error-messages-come-from-the-server))
- [ ] Read `user.tokens[0].policyProperties` instead of `user.policyProperties` after `findOrCreateUser` ([details](#findorcreateuser))
- [ ] Send tokens only in the `Authorization` header, and connect sockets with `auth: {token}` ([details](#tokens-are-only-read-from-the-authorization-header))
- [ ] Stop assigning to the core modules (`Buttress.User = ...`), and drop `?.` or `!` when using them ([details](#core-modules-are-read-only-and-throw-before-init))
- [ ] TypeScript only: write query operators with a `$`, and pass `update` a `{path, value}` update ([details](#types))

The rest of this guide is behaviour changes that need no code changes, and new options.

### Breaking changes

#### User policy properties need a `tokenId`

Buttress stores policy properties on a user's **token**, not on the user, and its routes include the token: `PUT user/:id/policy-property/:tokenId`. The client left the token out, so these calls returned 404.

`tokenId` is the token's id. Buttress also accepts the token's value there, but don't pass it (see below).

```js
// Before
await Buttress.User.setPolicyProperty(userId, {role: 'admin'});
await Buttress.User.updatePolicyProperty(userId, {role: 'admin'});
await Buttress.User.removePolicyProperty(userId, {role: 'admin'});
await Buttress.User.clearPolicyProperty(userId);

// After
await Buttress.User.setPolicyProperty(userId, tokenId, {role: 'admin'});
await Buttress.User.updatePolicyProperty(userId, tokenId, {role: 'admin'});
await Buttress.User.removePolicyProperty(userId, tokenId, {role: 'admin'});
await Buttress.User.clearPolicyProperty(userId, tokenId);
```

The transient policy helpers on the Buttress instance change the same way:

```js
// Before
await Buttress.createUserTransientPolicy(userId, policy);
await Buttress.removeUserTransientPolicy(userId, policyName);

// After
await Buttress.createUserTransientPolicy(userId, tokenId, policy);
await Buttress.removeUserTransientPolicy(userId, tokenId, policyName);
```

`removeUserTransientPolicy` now removes the property with the `remove-policy-property` route. Before, it read `user.policyProperties`, which Buttress never returns.

**Where to get a `tokenId`**

| Call                                     | What its tokens include                                   |
| ---------------------------------------- | --------------------------------------------------------- |
| `Buttress.User.get(userId)`              | `tokens[].id` and `tokens[].value`                        |
| `Buttress.User.findUser(app, appUserId)` | `tokens[].value`                                          |
| `Buttress.Auth.findOrCreateUser(...)`    | `tokens[].value`, plus `id` when the user was found by id |
| `Buttress.User.createToken(...)`         | `value`                                                   |

Use the token **id** where you have it. The `tokenId` is part of the request path, so a token value used there can end up in proxy and access logs.

#### Removed methods

Both methods called routes that Buttress doesn't have, so every call already failed. Delete the calls.

| Removed                               | Notes                                                                                                          |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `Token.updateRole(details)`           | Called `PUT token/roles`, which doesn't exist.                                                                 |
| `Auth.addAuthToUser(userId, appAuth)` | Called `PUT auth/:id/auth`, which doesn't exist. It also read `response.data`, which the client never returns. |

#### `removeAll` no longer accepts a filter

Buttress's delete-all route ignores the request body and deletes **every** entity in the collection. Code like `removeAll({status: 'draft'})` looked like it deleted only drafts but deleted everything. `removeAll` now throws if its first argument is anything other than `null` or `undefined`, and in TypeScript the parameter is typed as `null`.

```js
// Deletes everything (unchanged)
await Buttress.getCollection('post').removeAll();
await Buttress.getCollection('post').removeAll(null, {token});

// Now throws, before it silently deleted everything
await Buttress.getCollection('post').removeAll({status: 'draft'});

// To delete a subset, find the ids and use bulkRemove
const drafts = await Buttress.getCollection('post').search({status: {$eq: 'draft'}});
await Buttress.getCollection('post').bulkRemove(drafts.map((p) => p.id));
```

#### Error messages come from the server

Buttress replies to a failed request with a JSON body, `{statusMessage, message}`, where `message` is a code such as `invalid_token` or `missing_field`. The client used to throw that body away, so `err.message` was always the HTTP status text.

`ResponseError` now has:

| Property              | Before                            | After                                                                                       |
| --------------------- | --------------------------------- | ------------------------------------------------------------------------------------------- |
| `message`             | HTTP status text (`Unauthorized`) | Buttress's message (`invalid_token`). Falls back to the status text when the body has none. |
| `statusMessage`       | HTTP status text                  | HTTP status text (unchanged)                                                                |
| `statusCode` / `code` | HTTP status                       | HTTP status (unchanged)                                                                     |
| `body`                | –                                 | The parsed error body, or `undefined` if it wasn't JSON                                     |

If you compared `err.message` to a status text, compare `err.statusCode` or `err.statusMessage` instead:

```js
// Before
if (err.message === 'Unauthorized') { ... }

// After
if (err.statusCode === 401) { ... }
if (err.message === 'invalid_token') { ... }   // or match the specific reason
```

If you construct errors yourself, for example in test mocks:

- The `ResponseError` constructor is now `(response: {status, statusText?}, body?)`.
- `RequestError`'s `code` accepts a string, such as `ECONNREFUSED`.

#### `findOrCreateUser`

- **Policy properties go on the token.** When `authData` has no `policyProperties`, the user's `policyProperties` are copied onto the token Buttress creates. Read them from `user.tokens[0].policyProperties`; `user.policyProperties` is never set. When an existing user's token has no policy properties, they're set on that token with `setPolicyProperty`.
- **`tokens` is always filled in.** When a token has to be created separately, the result has `tokens: [newToken]` as well as the existing `token` value.
- **Errors keep their type.** Errors other than a 404 are rethrown as they are. Before they were wrapped in `new Error(err)`, which lost `statusCode` and `message`.

#### Tokens are only read from the `Authorization` header

The Buttress server no longer accepts `?token=` in the query string. It still accepts `query.token` on a socket handshake, but that's deprecated, logs a warning naming the token, and stops working in the next tagged Buttress release. The client always sends its token in the `Authorization` header, so this only affects code that adds a token itself.

```js
// No longer authenticates
await Buttress.getCollection('post').getAll({params: {token}});
io.connect(url, {query: `token=${token}`});

// Use
await Buttress.getCollection('post').getAll({token});
io.connect(url, {auth: {token}});
```

#### Core modules are read-only and throw before `init()`

`Buttress.App`, `Auth`, `Lambda`, `LambdaExecution`, `Policy`, `Token`, `User`, `SecureStore` and `AppDataSharing` are now getters. They return the same instances as `getCollection` (`Buttress.User === Buttress.getCollection('user')`), and are typed as always present, so strict TypeScript no longer needs `?.` or `!` to use them.

Using one before `init()`, or after `clean()`, throws `Errors.NotYetInitiated` instead of returning `undefined`. The transient policy helpers throw the same error instead of a plain `Error`.

The getters have no setters, so assigning to them (for example to stub a module in a test) throws a `TypeError`. Stub the module's methods instead, or its class prototype.

```js
// No longer works
Buttress.User = fakeUser;
if (Buttress.User) { ... }

// Use
Buttress.User.findUser = async () => user;
if (Buttress.initialised) { ... }
```

### Behaviour changes that need no code changes

| Change                                                                                 | What you'll notice                                                                                                                                                                                                                                                                                                                                              |
| -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AppDataSharing.activate()` sends the registration token in the `Authorization` header | Activation works again. Before, it sent the token in the query string and got a 401.                                                                                                                                                                                                                                                                            |
| `AppDataSharing.reactivate()` and `deactivate()` use `PUT`                             | They reach Buttress's routes. Before, they sent `POST` and got a 404. `deactivate()` works with any server, but `reactivate()` needs a Buttress from 29 September 2026 or later: earlier servers deactivate the share instead (see [Server compatibility](#server-compatibility)).                                                                              |
| `App.getPolicyPropertiesList()` with no argument calls `app/policy-property-list`      | It works again. Before, it hit `app/:id`, which only a system token can call.                                                                                                                                                                                                                                                                                   |
| Request bodies no longer set `Content-Length` by hand                                  | Bodies with non-ASCII characters (`é`, emoji) arrive intact. Before, the header counted characters rather than bytes and cut the body short.                                                                                                                                                                                                                    |
| Query params are URL-encoded                                                           | Values containing `&`, `=`, `#` or spaces reach the server as sent.                                                                                                                                                                                                                                                                                             |
| Network errors are retried                                                             | `GET`, `HEAD` and `OPTIONS` requests that fail without a response (`ECONNREFUSED`, `ECONNRESET`, …) retry up to 10 times with exponential back-off. This retry code already existed but never ran. **If the server is unreachable, a GET now takes about 3½ minutes to fail instead of failing straight away**, and that includes the schema fetch in `init()`. |
| `update` and `bulkUpdate` always send an array of updates                              | A single `{path, value}` update works on the core modules (`Buttress.User`, `Policy`, `SecureStore`…). Before, Buttress servers from before 29 September 2026 answered it with a 500, as their core routes only handled an array. Later servers accept either, as collections of your own schema always have.                                                   |
| `combineResults: false` is respected                                                   | The default is still `true`. Before, passing `false` was ignored.                                                                                                                                                                                                                                                                                               |
| A failed `init()` can be retried                                                       | If fetching the schema fails, the instance is reset with `clean()` and the error is rethrown. Before, the instance stayed marked as initialised with no schema, and calling `init()` again did nothing.                                                                                                                                                         |

### New options

#### `clientSessionId`

Buttress includes the `x-client-session-id` request header on the socket activity a request causes, so a client can recognise its own changes when they come back over the socket. The value must be a UUID v4, or the server rejects the request with 400 `invalid_client_session_id`.

```js
import {v4 as uuidv4} from 'uuid';

await Buttress.init({buttressUrl, appToken, apiPath, clientSessionId: uuidv4()});

// or later
Buttress.setClientSessionId(uuidv4());
```

A header of the same name passed in a request's `headers` overrides it for that request.

#### `sourceId` on `update`

Updates an entity held in a remote datastore with `PUT :collection/:sourceId/:id`:

```js
await Buttress.getCollection('post').update(id, [{path: 'title', value: 'New title'}], {sourceId});
```

#### `actualCount` on `count`

```js
await Buttress.getCollection('post').count(query, {}, {actualCount: true});
```

When a request matches more than one policy, Buttress normally counts the combined query once. With `actualCount`, it counts each policy's query and adds the counts together, so an entity matched by two policies is counted twice.

### Types

- `ButtressOptions` is defined once, in `types/ButtressOptions`, and still exported from the package root (`import {ButtressOptions} from '@buttress/api'`). It now includes `useLocalSchema` and `clientSessionId`. It's exported as a type only, which makes no difference for an interface.
- `RequestOptionsIn` gains `sourceId` and `actualCount`.
- `Policy.createPolicy`, `Policy.syncAppPolicy` and `createUserTransientPolicy` take a `Policy` instead of `any`. It requires a `version`, which Buttress has refused to create a policy without (400 `invalid_policy_no_version`) since November 2024. `Policy` and `PolicyConfig` are exported from the package root.
- `count`'s `query` and `sort` are optional. With no `query` it counts everything. Buttress ignores `sort`.
- The collection methods are typed instead of returning `any`. Nothing changes at runtime, but these calls no longer compile:

  | Call              | Before                                   | After                                            |
  | ----------------- | ---------------------------------------- | ------------------------------------------------ |
  | `search`, `count` | `{kudos: {gt: 5}}`, `{status: 'active'}` | `{kudos: {$gt: 5}}`, `{status: {$eq: 'active'}}` |
  | `update`          | `update(id, {kudos: 1})`                 | `update(id, {path: 'kudos', value: 1})`          |
  | `search` options  | `{project: 'content'}`                   | `{project: {content: 1}}`                        |
  | `search` sort     | any number                               | `{name: 1}`, or `0` or `null` for none           |

  Queries only accept the operators crag can also run in the browser: `$eq`, `$not`, `$gt`, `$gte`, `$lt`, `$lte`, `$in`, `$nin`, `$exists`, `$rex`, `$rexi`, `$inProp`, `$elMatch`, `$gtDate`, `$gteDate`, `$ltDate` and `$lteDate`, combined with `$and` and `$or`. Buttress itself accepts more, such as `gt` without the `$`, but crag would match nothing with those.

- `get`, `save`, `getAll`, `search` and `bulkGet` resolve to `Entity` (an `id` plus any other property) by default, `count` to a number, and `remove`, `removeAll` and `bulkRemove` to `true`. `getAll` and `search` resolve to a Node `Readable` when you pass `stream: true`.
- To type a collection's entities, and have queries check property names and values, pass your own type:

  ```ts
  import Buttress, {BaseSchema} from '@buttress/api';

  interface Post {
    id: string;
    content: string;
    kudos: number;
  }

  const posts = Buttress.getCollection<BaseSchema<Post>>('post');
  const popular = await posts.search({kudos: {$gt: 5}}); // Post[]
  ```

- `SecureStore.bulkSave` resolves to `true`, which is what Buttress answers, instead of being typed as the saved stores. For this, `BaseSchema` takes a second, optional type parameter for what `bulkSave` resolves to. It defaults to the entities, so `BaseSchema<Post>` is unchanged.
- `BaseSchema`, `Entity`, `Query`, `QueryOperators`, `Sort`, `Projection`, `UpdateOperation`, `UpdateResult`, `BulkUpdateItem` and `BulkUpdateResult` are exported from the package root.

### Server compatibility

3.0.0-53 matches the routes in the current Buttress server. The route fixes (policy property routes with `:tokenId`, `PUT` for re/deactivation) match routes that were already on the server by August 2025, so this client works with servers from before the recent server changes too. With an older server that doesn't send a JSON error body, `err.message` falls back to the HTTP status text as before.

A few calls also depend on Buttress fixes from 29 September 2026. With an earlier server:

| Call                                | What happens                                                                                         |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `AppDataSharing.reactivate(id)`     | Deactivates the share instead.                                                                       |
| `Policy.deletePolicyByName({name})` | Looks the name up across every app, so it can delete another app's policy of the same name.          |
| `SecureStore.bulkSave(stores)`      | Resolves to `true` but stores nothing usable. Save the stores one at a time with `SecureStore.save`. |
| A request body Buttress can't parse | Gets a 500 instead of a 400 `invalid_body`.                                                          |
