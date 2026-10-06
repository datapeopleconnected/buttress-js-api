### Unreleased

**Needs a Buttress server containing `390fea49` (buttress-js develop) or later.** Older servers answer `QUERY` with 404.

- `search`, `count` and `bulkGet` use the HTTP `QUERY` method
  ([RFC 10008](https://www.rfc-editor.org/rfc/rfc10008)) instead of `SEARCH`. Buttress still answers `SEARCH`, with a
  `Deprecation` header, and policies treat the two as one verb, so existing policies keep working.
- Every `QUERY` is sent with `Content-Type: application/json` and a JSON body, an empty `{}` when there's nothing else
  to send. Buttress answers a `QUERY` without the header with 415 `unsupported_query_type`.
- New behaviour: `QUERY` requests are retried like `GET` when they never get a response, up to `maxRetries`.
  `QUERY` is safe and idempotent, so this can't apply a change twice. `SEARCH` requests were never retried.
- Ids and names passed to `get`, `update`, `remove` and the `User`, `SecureStore`, `Lambda`, `AppDataSharing` and `App`
  methods are percent-encoded into a single path segment, so one holding `/`, `?`, `#` or `../` can no longer reach a
  different route with the app's token. An id or name of `.`, `..` or `''`, or one that isn't a string or number, is
  refused with an error before anything is sent.
- A secure store's `getValue` returns a stored `0`, `''`, `false` or `null` instead of throwing
  "<key> does not exist on the secure store". It throws only for a key the store doesn't hold, so a name the stored data
  merely inherits, such as `toString`, now throws too rather than returning a function.
- `Lambda.scheduleExecution` sends the metadata it's given when there's no `executeAfter`, which Buttress takes as
  "run now". It used to send an empty body, dropping the metadata. `executeAfter` and `metadata` are optional in the
  types, and `data` passed in the options (such as a `deploymentId`) is kept alongside them rather than replaced.
- `Auth.findOrCreateUser` sets a user's policy properties on their token by the token's id, never its value. Finding a
  user by its auth app id returns only its tokens' values, so it used to send the token's secret value in the request
  path, where it ends up in proxy and access logs. It now looks the id up with `User.get` (one more request, only when
  the properties need setting), and throws if the token still has no id.
- A module taken before `Buttress.clean()`, from `getCollection` or a property such as `Buttress.User`, now throws
  `NotYetInitiated` when it's used, from its requests and `createObject`. It used to go on sending the old app's token
  to the old app's URLs, even after `init()` with another app. Get modules again after `init()`.
- `maxRetries: N` retries a request that never got a response N times after the first attempt, as documented. It used
  to count the first attempt, so `maxRetries: 1` never retried and N gave N - 1 retries. This applies to `QUERY`
  (`search`, `count`, `bulkGet`) as well as `GET`. With the default of 10, a request to a Buttress that stays
  unreachable now takes about 7 minutes of backoff to fail rather than about 3½.
- An `init()` called while an earlier one is still loading the schema waits for it and resolves to the same result. It
  used to resolve straight away, so a `getCollection` straight after it could fail with `SchemaNotFound` or
  `NotYetInitiated`. A later `init()` resolves to the first one's result rather than `undefined`.
- **Breaking:** `init()` on a client that's already initialised, or still initialising, rejects with "Buttress is
  already initialised with different options" when its options (or `isolated` flag) differ from the first call's. It
  used to resolve and change nothing, so code re-initialising to switch apps went on reading and writing the first app.
  Call `clean()` before `init()` to switch. The same options, compared deeply, resolve as before.
- `createObject(path)` throws "Unable to create an object for '<path>'" when the path names a property that holds a
  value, such as a plain array (one without a `__schema`) or a string, instead of overflowing the stack with
  `RangeError: Maximum call stack size exceeded`. Nested objects and arrays with a `__schema` build as before.
- A secure store's `getValue` and `setValue` refuse an empty key or one holding a `.`: `getValue` throws, `setValue`
  rejects. `setValue('a.b', v)` used to write the nested path `storeData.a.b`, which `getValue('a.b')` couldn't read
  back, and let a key taken from input write anywhere below `storeData`. A dotted key already in a store's data can no
  longer be read through `getValue`.
- `createObject` reads a schema's date `__default` day first (en-GB), as Buttress does, so `01/02/2026` is 1 February in
  an object built by the client as well as one built by Buttress. The client used to read it month first (2 January).
- `allowUnauthorized` is deprecated and no longer documented. It never did anything: TLS certificates have always been
  verified, and still are. `init()` logs a warning when it's `true`, outside a lambda, so remove it from your options.
  A server with a self-signed certificate needs a certificate Node trusts, such as one added with
  `NODE_EXTRA_CA_CERTS`.
- **Breaking:** a call given a `token` option that's empty (`''`, `null` or `undefined`) throws "The token passed in the
  options is ..." instead of quietly using the instance token. A user token that failed to load used to send the
  request with the app's token and its privileges. Leave the `token` key out to use the instance token.
- A client set up without an `appToken` can make any call that passes its own `token` option, and
  `AppDataSharing.activate` works with just the registration token. Every call used to throw "No default token
  provided" first. A call without its own token still throws it. `appToken` is optional in the options type.
- Query `params` set to `null` or `undefined` are left out of the URL instead of being sent as the text `null` or
  `undefined`, which Buttress filtered on. An array is sent as one comma-separated value, `ids=a,b`, the way Buttress
  reads a list; an empty array is left out, and an item holding a comma is refused. An object, which used to be sent
  as `[object Object]`, is refused with an error rather than sent.
- A `POST` to an http `buttressUrl` that Buttress redirects to https is spotted and sent again over https when the URL
  has capital letters in its host or an explicit default port, such as `http://Buttress.example` or `http://host:80`.
  It used to miss those, and the call resolved to the answer to the bodyless `GET` the redirect was followed with.
- When results from several sources are merged (`combineResults`, on by default), a `"__proto__"` key in a data
  sharing partner's item is kept as an ordinary property instead of replacing the merged item's prototype, so partner
  data can't make an item report inherited properties such as `isAdmin` that it doesn't have.
- Every call that makes a request rejects its promise when it refuses to send, rather than throwing where it's called,
  so `x.get(id).catch(...)` handles the error. That covers a missing app token, an empty `token` option, an id or name
  refused as a path segment and a `removeAll` filter, from `get`, `save`, `search` and the rest, and from every
  `User`, `Lambda`, `Policy`, `Token`, `App` and `AppDataSharing` method. Code that `await`s its calls sees no
  difference. Code that caught these errors with a `try` around a call it didn't `await` now gets a rejected promise
  instead.
- `Auth.findOrCreateUser` resolves to the user when Buttress refuses to create it because it already exists
  (`user_already_exists_with_that_name`), looking it up again, so two first logins at once for the same person both
  get the user that one of them created. One of them used to reject. If the second lookup still doesn't find the user,
  as when Buttress matched another user's email, the refusal is thrown as before.
- `createUserTransientPolicy` creates the policy with `transient: true`, and `Policy` has an optional `transient`. When a
  transient policy's limit passes, Buttress takes the policy property named after it off the tokens it selected, as
  well as removing the policy; a policy that isn't transient leaves tokens as they are. A Buttress without the flag
  stores the policy without it.
- **Breaking:** `AppDataSharing.updateDataSharingPolicy(id, policyConfig)` takes a list of policy configs, given as
  `policyConfig` is when the agreement is created, and the agreement's policy is replaced with them. It used to be typed
  as taking any object, which Buttress ignored, answering `true` while the partner kept the access it was given when
  the agreement was made. A Buttress containing `3c5274bb` (buttress-js develop) or later refuses anything but a
  non-empty list with 400 `invalid_policy`.

### 3.0.0-51

Change log will be maintained after pre-release cycle.
