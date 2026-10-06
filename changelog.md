### Unreleased

**Needs a Buttress server containing `390fea49` (buttress-js develop) or later.** Older servers answer `QUERY` with 404.

- `search`, `count` and `bulkGet` use the HTTP `QUERY` method
  ([RFC 10008](https://www.rfc-editor.org/rfc/rfc10008)) instead of `SEARCH`. Buttress still answers `SEARCH`, with a
  `Deprecation` header, and policies treat the two as one verb, so existing policies keep working.
- Every `QUERY` is sent with `Content-Type: application/json` and a JSON body, an empty `{}` when there's nothing else
  to send. Buttress answers a `QUERY` without the header with 415 `unsupported_query_type`.
- New behaviour: `QUERY` requests are retried like `GET` when they never get a response, up to `maxRetries`.
  `QUERY` is safe and idempotent, so this can't apply a change twice. `SEARCH` requests were never retried.

### 3.0.0-51

Change log will be maintained after pre-release cycle.
