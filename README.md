# Buttress API

Buttress API is a comprehensive solution for interacting with Buttress, a federated real-time open data platform.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## Installation

To install the Buttress API, use npm:

```sh
npm install @buttress/api
```

## Usage
Words and examples to be written here soon.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request.

Development needs Node 24 or later (`nvm use` picks it up from `.nvmrc`).

| Script                  | What it does                                                            |
| ----------------------- | ----------------------------------------------------------------------- |
| `npm run build`         | Compiles `src/` to `dist/`.                                             |
| `npm run lint`          | Runs ESLint on `src/`.                                                  |
| `npm run licence-check` | Checks every file in `src/`, `scripts/` and `test/` has the licence header. |
| `npm run test:unit`     | Runs the unit tests. No Buttress needed.                                |
| `npm run test:e2e`      | Builds, then runs the end-to-end tests against a Buttress in Docker.    |

The pre-commit hook runs `lint`, `build` and `licence-check`. CI runs the same checks and the unit tests on every
push to `main` and `develop`, and on pull requests.

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
This project is licensed under the AGPL-3.0-or-later License. See the LICENSE or COPYING file for details.