# @buttress/api

The official Node.js / TypeScript client for [Buttress](https://github.com/datapeopleconnected/buttress), the
federated real-time open data platform. It wraps Buttress's REST API behind a small set of collection
modules, so you can authenticate, and read and write schema-defined data, without hand-rolling HTTP requests.

## Contents

- [Installation](#installation)
- [Quick start](#quick-start)
- [Core concepts](#core-concepts)
- [Working with data](#working-with-data)
- [Configuration](#configuration)
- [Development](#development)
- [License](#license)

## Installation

```sh
npm install @buttress/api
```

Requires Node.js 22 or later, and a Buttress server that takes the HTTP `QUERY` method (buttress-js `390fea49` or
later). Older servers answer `QUERY` with 404.

## Quick start

```ts
import Buttress from '@buttress/api';

const appToken = process.env.BUTTRESS_APP_TOKEN;
if (!appToken) throw new Error('BUTTRESS_APP_TOKEN is not set');

await Buttress.init({
  buttressUrl: 'https://your-buttress-instance.com',
  appToken,
  apiPath: 'my-app',
  version: 1,
});

// Read
const posts = await Buttress.getCollection('post').getAll();

// Write
const post = await Buttress.getCollection('post').save({
  title: 'Hello, Buttress',
  body: 'Getting started with the API client.',
});
```

## Core concepts

Buttress is schema-driven: each app defines collections (schema), and the client builds a module for every
collection it discovers so you can read and write that data.

- **`Buttress.init(options)`** connects to a Buttress instance, authenticates with your app token, and pulls down
  (or pushes up) the schema. It must be called, and awaited, before anything else.
- **`Buttress.getCollection(name)`** returns the module for a schema collection (e.g. `'post'`, `'user'`), creating
  it on first use. Collection names must be camelCase.
- A handful of collections ship as **named, first-class modules** on the `Buttress` instance because they carry
  behaviour beyond plain CRUD: `App`, `Auth`, `Lambda`, `LambdaExecution`, `Policy`, `Token`, `User`,
  `SecureStore`, `AppDataSharing`. These are also reachable through `getCollection`.
- **`Errors`** exposes the client's typed error classes for use in `catch` blocks.

## Working with data

Every collection module (whether reached through `getCollection` or a named module like `Buttress.User`) exposes
the same base CRUD surface:

```ts
const posts = Buttress.getCollection('post');

await posts.getAll(); // fetch every entity
await posts.get(id); // fetch one entity
await posts.save({title: '...'}); // create, rejected as a duplicate if given an id that's already taken
await posts.update(id, {path: 'title', value: '...'}); // update by path, see below
await posts.remove(id); // delete one
await posts.removeAll(); // delete every entity in the collection
await posts.count(query); // count matching a filter
await posts.search(query); // query with a filter
```

`search`, `count` and `bulkGet` are sent with the HTTP `QUERY` method
([RFC 10008](https://www.rfc-editor.org/rfc/rfc10008)) and a JSON body. `QUERY` is safe and idempotent, so like `GET` it's retried when the request never gets a response.

`update` takes update-by-path operations rather than a partial entity: one `{path, value}`, or an array of them to
apply in one request. It resolves to the operations it applied, each with its `type`, `path` and `value`, not to the
updated entity.

```ts
await posts.update(id, {path: 'title', value: 'Hello again'});

await posts.update(id, [
  {path: 'author.name', value: 'Ada'}, // a dot path reaches a nested property
  {path: 'views.__increment__', value: 1}, // adds to a number, a negative value subtracts
]);
```

On an array property, paths work like this:

| `path`              | Effect                                                                       |
| ------------------- | ---------------------------------------------------------------------------- |
| `tags`              | Appends `value` to the array, or replaces the whole array if `value` is one. |
| `tags.2`            | Sets the item at index 2.                                                    |
| `tags.2.__remove__` | Removes the item at index 2. `value` is still required, so pass `''`.        |

Named modules add their own methods on top of this, for example:

```ts
// Find or create a user from a third-party login; the user comes back with their tokens
const user = await Buttress.Auth.findOrCreateUser({app: 'google', appId: googleUserId}, {domains, policyProperties});

// Give a user a policy property, scoped to one of their tokens. Pass the token's id, never its value: it goes in the
// request path, where it would end up in access logs. User.get returns each token's id.
const {tokens} = await Buttress.User.get(user.id);
await Buttress.User.updatePolicyProperty(user.id, tokens[0].id, {role: 'admin'});

// Manage schema-level access policies. Buttress refuses a policy without a version.
await Buttress.Policy.createPolicy({
  name: 'admin',
  version: '1',
  selection: {role: {'@eq': 'admin'}},
  config: [{verbs: ['GET', 'QUERY'], schema: ['post']}],
});
```

Policies treat `QUERY` and `SEARCH` as the same verb, so an existing policy that grants `SEARCH` also grants `QUERY`.

If you're upgrading from an older version of this client, see [MIGRATION.md](MIGRATION.md) for breaking changes.

## Configuration

`Buttress.init(options)` accepts:

| Option            | Type       | Description                                                                                   |
| ----------------- | ---------- | --------------------------------------------------------------------------------------------- |
| `buttressUrl`     | `string`   | Base URL of the Buttress instance.                                                            |
| `appToken`        | `string`   | Your app's API token, sent with every call that doesn't pass its own `token` option.          |
| `apiPath`         | `string`   | Your app's API path, as configured in Buttress.                                               |
| `version`         | `number`   | API version to target.                                                                        |
| `schema`          | `object[]` | Schema to push to Buttress, or to use locally (see `useLocalSchema`).                         |
| `update`          | `boolean`  | Push the local `schema` to Buttress on init instead of fetching it.                           |
| `useLocalSchema`  | `boolean`  | Build modules from the local `schema` instead of fetching it from Buttress.                   |
| `clientSessionId` | `string`   | A UUID v4 sent as `x-client-session-id`, attached to the socket activity your requests cause. |
| `maxRetries`      | `number`   | Retries, after the first attempt, of a `GET` or `QUERY` that got no response. Default 10.     |

TLS certificates are always verified. The `allowUnauthorized` option older versions documented never did anything,
and `init()` warns when it's set.

## Development

Contributions are welcome — please open an issue or pull request.

Development needs Node 24 or later (`nvm use` picks it up from `.nvmrc`).

| Script                  | What it does                                                                |
| ----------------------- | --------------------------------------------------------------------------- |
| `npm run build`         | Compiles `src/` to `dist/`.                                                 |
| `npm run lint`          | Runs oxlint over the project. `lint:fix` fixes what it can.                 |
| `npm run format`        | Formats the project with oxfmt. `format:check` only reports.                |
| `npm run licence-check` | Checks every file in `src/`, `scripts/` and `test/` has the licence header. |
| `npm run test:unit`     | Runs the unit tests. No Buttress needed.                                    |
| `npm run test:e2e`      | Builds, then runs the end-to-end tests against a Buttress in Docker.        |

The pre-commit hook runs `lint`, `format:check`, `build` and `licence-check`. CI runs the same checks, the unit tests
and the end-to-end tests on every push to `main` and `develop`, and on pull requests.

### End-to-end tests

The end-to-end tests need [Docker](https://docs.docker.com/get-docker/) with Compose v2. `scripts/e2e.ts` starts
Buttress, MongoDB and Redis in containers, runs the tests with `BUTTRESS_TEST_API_URL` and
`BUTTRESS_TEST_SUPER_APP_KEY` set, and then removes the containers. Every run starts from an empty database.

It runs any command, so you can run a single suite:

```sh
npm run build && npx tsx scripts/e2e.ts npm run test-policy
```

The tests run against `dpcltd/buttress:3.0.0`. Set `BUTTRESS_IMAGE` to test against a different image, such as
`dpcltd/buttress:develop` or one built from a Buttress checkout. Docker only pulls an image it doesn't have, so pull
a moving tag like `develop` yourself to get its latest build.

### Publishing

Releases are published to npm by the Publish workflow:

1. Bump `version` in `package.json` on `main` and push.
2. Create a GitHub release with the tag `v<version>`, for example `v3.0.0-53`.

The workflow runs CI and checks that the tag matches `package.json`. It then publishes to the `latest` dist-tag, or
to `next` if the release is marked as a pre-release.

## License

This project is licensed under the AGPL-3.0-or-later License. See the [LICENSE](LICENSE) or [COPYING](COPYING)
file for details.
