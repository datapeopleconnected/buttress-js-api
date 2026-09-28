# @buttress/api

The official Node.js / TypeScript client for [Buttress](https://github.com/datapeopleconnected/buttress), the
federated real-time open data platform. It wraps Buttress's REST API and realtime sockets behind a small set of
collection modules, so you can authenticate, read and write schema-defined data, and react to changes without
hand-rolling HTTP requests.

## Contents

- [Installation](#installation)
- [Quick start](#quick-start)
- [Core concepts](#core-concepts)
- [Working with data](#working-with-data)
- [Realtime updates](#realtime-updates)
- [Configuration](#configuration)
- [Development](#development)
- [License](#license)

## Installation

```sh
npm install @buttress/api
```

Requires Node.js 22 or later.

## Quick start

```ts
import Buttress from '@buttress/api';

await Buttress.init({
  buttressUrl: 'https://your-buttress-instance.com',
  appToken: process.env.BUTTRESS_APP_TOKEN,
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

// Listen for changes
Buttress.getCollection('post').socket.on('post-updated', (updatedPost) => {
  console.log('post changed:', updatedPost);
});
```

## Core concepts

Buttress is schema-driven: each app defines collections (schema), and the client builds a module for every
collection it discovers so you can read, write and subscribe to that data.

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
await posts.save({title: '...'}); // create or update
await posts.update(id, updates); // partial update
await posts.remove(id); // delete one
await posts.removeAll(); // delete every entity in the collection
await posts.count(); // count matching a filter
await posts.search(query); // query with a filter
```

Named modules add their own methods on top of this, for example:

```ts
// Authenticate a user and get their token
const { user, token } = await Buttress.Auth.findOrCreateUser({ ... });

// Give a user a policy property, scoped to one of their tokens
await Buttress.User.updatePolicyProperty(user.id, token.id, { role: 'admin' });

// Manage schema-level access policies
await Buttress.Policy.createPolicy({ name: 'admin', selection: { ... } });
```

If you're upgrading from an older version of this client, see [MIGRATION.md](MIGRATION.md) for breaking changes.

## Realtime updates

Each collection module has a `socket` that emits events when data changes on the server (`<collection>-created`,
`<collection>-updated`, `<collection>-removed`), so you can keep local state in sync without polling.

## Configuration

`Buttress.init(options)` accepts:

| Option              | Type       | Description                                                                                   |
| ------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| `buttressUrl`       | `string`   | Base URL of the Buttress instance.                                                            |
| `appToken`          | `string`   | Your app's API token.                                                                         |
| `apiPath`           | `string`   | Your app's API path, as configured in Buttress.                                               |
| `version`           | `number`   | API version to target.                                                                        |
| `schema`            | `object[]` | Schema to push to Buttress, or to use locally (see `useLocalSchema`).                         |
| `update`            | `boolean`  | Push the local `schema` to Buttress on init instead of fetching it.                           |
| `useLocalSchema`    | `boolean`  | Build modules from the local `schema` instead of fetching it from Buttress.                   |
| `allowUnauthorized` | `boolean`  | Allow requests to hosts with self-signed/invalid TLS certificates.                            |
| `clientSessionId`   | `string`   | A UUID v4 sent as `x-client-session-id`, attached to the socket activity your requests cause. |

## Development

Contributions are welcome — please open an issue or pull request.

Development needs Node 24 or later (`nvm use` picks it up from `.nvmrc`).

| Script                  | What it does                                                                |
| ----------------------- | --------------------------------------------------------------------------- |
| `npm run build`         | Compiles `src/` to `dist/`.                                                 |
| `npm run lint`          | Runs ESLint over the project. `lint:fix` fixes what it can.                 |
| `npm run format`        | Formats the project with Prettier. `format:check` only reports.             |
| `npm run licence-check` | Checks every file in `src/`, `scripts/` and `test/` has the licence header. |
| `npm run test:unit`     | Runs the unit tests. No Buttress needed.                                    |
| `npm run test:e2e`      | Builds, then runs the end-to-end tests against a Buttress in Docker.        |

The pre-commit hook runs `lint`, `format:check`, `build` and `licence-check`. CI runs the same checks and the unit
tests on every push to `main` and `develop`, and on pull requests.

### End-to-end tests

The end-to-end tests need [Docker](https://docs.docker.com/get-docker/) with Compose v2. `scripts/e2e.js` starts
Buttress, MongoDB and Redis in containers, runs the tests with `BUTTRESS_TEST_API_URL` and
`BUTTRESS_TEST_SUPER_APP_KEY` set, and then removes the containers. Every run starts from an empty database.

It runs any command, so you can run a single suite:

```sh
npm run build && node scripts/e2e.js npm run test-policy
```

Set `BUTTRESS_IMAGE` to test against a different image than `dpcltd/buttress:develop`, such as one built from a
Buttress checkout.

### Publishing

Releases are published to npm by the Publish workflow:

1. Bump `version` in `package.json` on `main` and push.
2. Create a GitHub release with the tag `v<version>`, for example `v3.0.0-53`.

The workflow runs CI and checks that the tag matches `package.json`. It then publishes to the `latest` dist-tag, or
to `next` if the release is marked as a pre-release.

## License

This project is licensed under the AGPL-3.0-or-later License. See the [LICENSE](LICENSE) or [COPYING](COPYING)
file for details.
