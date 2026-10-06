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

### 3.0.0-51

Change log will be maintained after pre-release cycle.
