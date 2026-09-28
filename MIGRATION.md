# Migrating from 3.0.0-52 to 3.0.0-53

3.0.0-53 brings `@buttress/api` back in line with the current Buttress server. Several calls pointed at routes that don't exist, used the wrong HTTP verb, or authenticated in a way the server no longer accepts. Fixing them changes a few method signatures and the shape of errors.

## Checklist

- [ ] Pass a `tokenId` to the `User.*PolicyProperty` methods and the transient policy helpers ([details](#user-policy-properties-need-a-tokenid))
- [ ] Remove calls to `Token.updateRole` and `Auth.addAuthToUser` ([details](#removed-methods))
- [ ] Stop passing an argument to `removeAll` ([details](#removeall-no-longer-accepts-a-filter))
- [ ] Check any code that reads `err.message` from a failed request ([details](#error-messages-come-from-the-server))
- [ ] Read `user.tokens[0].policyProperties` instead of `user.policyProperties` after `findOrCreateUser` ([details](#findorcreateuser))
- [ ] Send tokens only in the `Authorization` header, and connect sockets with `auth: {token}` ([details](#tokens-are-only-read-from-the-authorization-header))

The rest of this guide is behaviour changes that need no code changes, and new options.

## Breaking changes

### User policy properties need a `tokenId`

Buttress stores policy properties on a user's **token**, not on the user, and its routes include the token: `PUT user/:id/policy-property/:tokenId`. The client left the token out, so these calls returned 404.

`tokenId` accepts either the token's id or its value.

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

| Call | What its tokens include |
|---|---|
| `Buttress.User.get(userId)` | `tokens[].id` and `tokens[].value` |
| `Buttress.User.findUser(app, appUserId)` | `tokens[].value` |
| `Buttress.Auth.findOrCreateUser(...)` | `tokens[].value`, plus `id` when the user was found by id |
| `Buttress.User.createToken(...)` | `value` |

Use the token **id** where you have it. The `tokenId` is part of the request path, so a token value used there can end up in proxy and access logs.

### Removed methods

Both methods called routes that Buttress doesn't have, so every call already failed. Delete the calls.

| Removed | Notes |
|---|---|
| `Token.updateRole(details)` | Called `PUT token/roles`, which doesn't exist. |
| `Auth.addAuthToUser(userId, appAuth)` | Called `PUT auth/:id/auth`, which doesn't exist. It also read `response.data`, which the client never returns. |

### `removeAll` no longer accepts a filter

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

### Error messages come from the server

Buttress replies to a failed request with a JSON body, `{statusMessage, message}`, where `message` is a code such as `invalid_token` or `missing_field`. The client used to throw that body away, so `err.message` was always the HTTP status text.

`ResponseError` now has:

| Property | Before | After |
|---|---|---|
| `message` | HTTP status text (`Unauthorized`) | Buttress's message (`invalid_token`). Falls back to the status text when the body has none. |
| `statusMessage` | HTTP status text | HTTP status text (unchanged) |
| `statusCode` / `code` | HTTP status | HTTP status (unchanged) |
| `body` | – | The parsed error body, or `undefined` if it wasn't JSON |

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

### `findOrCreateUser`

- **Policy properties go on the token.** When `authData` has no `policyProperties`, the user's `policyProperties` are copied onto the token Buttress creates. Read them from `user.tokens[0].policyProperties`; `user.policyProperties` is never set. When an existing user's token has no policy properties, they're set on that token with `setPolicyProperty`.
- **`tokens` is always filled in.** When a token has to be created separately, the result has `tokens: [newToken]` as well as the existing `token` value.
- **Errors keep their type.** Errors other than a 404 are rethrown as they are. Before they were wrapped in `new Error(err)`, which lost `statusCode` and `message`.

### Tokens are only read from the `Authorization` header

The Buttress server no longer accepts `?token=` in the query string or `query.token` on a socket handshake. The client always sends its token in the `Authorization` header, so this only affects code that adds a token itself.

```js
// No longer authenticates
await Buttress.getCollection('post').getAll({params: {token}});
io.connect(url, {query: `token=${token}`});

// Use
await Buttress.getCollection('post').getAll({token});
io.connect(url, {auth: {token}});
```

## Behaviour changes that need no code changes

| Change | What you'll notice |
|---|---|
| `AppDataSharing.activate()` sends the registration token in the `Authorization` header | Activation works again. Before, it sent the token in the query string and got a 401. |
| `AppDataSharing.reactivate()` and `deactivate()` use `PUT` | They work again. Before, they sent `POST` and got a 404. |
| `App.getPolicyPropertiesList()` with no argument calls `app/policy-property-list` | It works again. Before, it hit `app/:id`, which only a system token can call. |
| Request bodies no longer set `Content-Length` by hand | Bodies with non-ASCII characters (`é`, emoji) arrive intact. Before, the header counted characters rather than bytes and cut the body short. |
| Query params are URL-encoded | Values containing `&`, `=`, `#` or spaces reach the server as sent. |
| Network errors are retried | `GET`, `HEAD` and `OPTIONS` requests that fail without a response (`ECONNREFUSED`, `ECONNRESET`, …) retry up to 10 times with exponential back-off. This retry code already existed but never ran. **If the server is unreachable, a GET now takes about 3½ minutes to fail instead of failing straight away**, and that includes the schema fetch in `init()`. |
| `combineResults: false` is respected | The default is still `true`. Before, passing `false` was ignored. |
| A failed `init()` can be retried | If fetching the schema fails, the instance is reset with `clean()` and the error is rethrown. Before, the instance stayed marked as initialised with no schema, and calling `init()` again did nothing. |
| `clean()` clears the core module properties | After `clean()`, `Buttress.App`, `Buttress.User` and the other core modules are `undefined` until the next `init()`. |

## New options

### `clientSessionId`

Buttress includes the `x-client-session-id` request header on the socket activity a request causes, so a client can recognise its own changes when they come back over the socket. The value must be a UUID v4, or the server rejects the request with 400 `invalid_client_session_id`.

```js
import {v4 as uuidv4} from 'uuid';

await Buttress.init({buttressUrl, appToken, apiPath, clientSessionId: uuidv4()});

// or later
Buttress.setClientSessionId(uuidv4());
```

A header of the same name passed in a request's `headers` overrides it for that request.

### `sourceId` on `update`

Updates an entity held in a remote datastore with `PUT :collection/:sourceId/:id`:

```js
await Buttress.getCollection('post').update(id, [{path: 'title', value: 'New title'}], {sourceId});
```

### `actualCount` on `count`

```js
await Buttress.getCollection('post').count(query, {}, {actualCount: true});
```

When a request matches more than one policy, Buttress normally counts the combined query once. With `actualCount`, it counts each policy's query and adds the counts together, so an entity matched by two policies is counted twice.

## Types

- `ButtressOptions` is defined once, in `types/ButtressOptions`, and still exported from the package root (`import {ButtressOptions} from '@buttress/api'`). It now includes `useLocalSchema` and `clientSessionId`. It's exported as a type only, which makes no difference for an interface.
- `RequestOptionsIn` gains `sourceId` and `actualCount`.

## Server compatibility

3.0.0-53 matches the routes in the current Buttress server. The route fixes (policy property routes with `:tokenId`, `PUT` for re/deactivation) match routes that were already on the server by August 2025, so this client works with servers from before the recent server changes too. With an older server that doesn't send a JSON error body, `err.message` falls back to the HTTP status text as before.
