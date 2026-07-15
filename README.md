# postman-newman-automation

[![Newman API Tests](https://github.com/Libin-Samkutty/postman-newman-automation/actions/workflows/ci.yml/badge.svg)](https://github.com/Libin-Samkutty/postman-newman-automation/actions/workflows/ci.yml)
[![Nightly Full Regression](https://github.com/Libin-Samkutty/postman-newman-automation/actions/workflows/nightly.yml/badge.svg)](https://github.com/Libin-Samkutty/postman-newman-automation/actions/workflows/nightly.yml)
[![Latest Regression Report](https://img.shields.io/badge/report-latest%20regression-blue)](https://libin-samkutty.github.io/postman-newman-automation/)

Collaborative API testing layer for the HealthSaaS platform, targeting the
public [DummyJSON](https://dummyjson.com) API.

> Postman is not a replacement for Pytest. It is the shared layer that sits
> above it — exploratory testing, documentation, and quick regression.
> Pytest owns the complex workflows and contract gates. Postman owns the
> human-readable, cross-team API contract.
>
> The HealthSaaS REST API layer is tested at two depths. Postman collections
> serve as the shared API testing layer across QA, development, and product
> — they are human-readable, runnable in CI via Newman, and serve as living
> documentation of expected API behaviour. Newman executes these collections
> in Docker with HTMLExtra reporting on every deployment.

## Collection-as-code

Nothing under `collections/` is hand-edited. Requests and test scripts are
authored in plain JS under `src/`, using the official [`postman-collection`](https://www.npmjs.com/package/postman-collection)
SDK, and compiled to `.postman_collection.json` by `scripts/build-collections.js`.
This keeps requests and assertions reviewable and diffable in PRs, while
still producing the collection file that Postman's GUI can import directly.

CI fails (`npm run check:collections-drift`) if the committed JSON ever
drifts from what `src/` would generate — the JS is the source of truth.

```
src/build-auth.js       ─┐
src/build-users.js       │
src/build-products.js    ├─→ scripts/build-collections.js ─→ collections/*.postman_collection.json
src/build-carts.js       │
src/build-regression.js ─┘      (assembles the four above into folders)
```

## Getting started

```bash
npm install
npm run build:collections   # generates collections/*.json from src/
npm run validate            # structural lint of the generated collections
npm run test:smoke          # runs the auth collection against staging
npm run test:regression     # runs all four collections in sequence
npm run test:data-driven    # runs users.collection.json once per row in data/users.csv
```

`Login - Valid Credentials` seeds the `accessToken` / `refreshToken` /
`userId` collection variables Users, Products, and Carts reference.
`regression.collection.json` runs Auth first automatically — but
requests that actually require a token (`Get Authenticated User`, both
Carts requests) don't strictly *depend* on that ordering: a shared
pre-request script (`src/lib/auth-flow.js`) decodes the stored access
token's JWT `exp` claim and transparently re-authenticates via
`/auth/login` if it's missing, unparseable, or expiring within 60s. Run
`carts.collection.json` on its own with `npx newman run
collections/carts.collection.json -e environments/staging.environment.json`
and it logs itself in first.

## Coverage

| Collection | Endpoints Covered |
|------------|------------------|
| auth | POST /auth/login, GET /auth/me, POST /auth/refresh |
| users | GET /users, GET /users/:id, POST /users/add, PUT /users/:id, DELETE /users/:id |
| products | GET /products, GET /products/search, GET /products/:id, POST /products/add |
| carts | GET /carts/user/:userId, POST /carts/add |
| regression | Orchestration — runs all of the above in sequence |

Every collection includes negative cases (401 on invalid token, 404 on
missing resource) alongside the happy path, response schema validation via
`tv4`, and a response-time assertion (under 2s) on every request.

Note: DummyJSON's `/users/add` and `/products/add` endpoints simulate
creation but don't persist — the returned ID can't be used for a
subsequent `PUT`/`DELETE`. Update/Delete User run against a real seeded
user ID (2) instead.

## Data-driven runs

`data/users.csv` (firstName, lastName, email, age) drives `Create User`
across `npm run test:data-driven` — each CSV row becomes one Newman
iteration with its own user. The same request also runs standalone (a
single iteration, no `--iteration-data`), falling back to a
timestamp-generated name/email so repeat single runs don't collide —
`src/lib/test-scripts.js`'s `dynamicUserPreRequest()` reads
`pm.iterationData.get(...)` and only falls back when it's empty.

## Environments

`environments/{local,staging,production}.environment.json` all point at the
same public `https://dummyjson.com` base URL — there's no separate
staging/production instance for this demo API. The three-environment split
demonstrates the pattern (`--environment environments/${ENV}.environment.json`)
that a real deployment would use with per-environment base URLs.

## Docker

```bash
npm run test:docker   # docker compose up --build, runs regression, writes HTMLExtra report
```

## CI/CD

- **GitHub Actions** (`.github/workflows/ci.yml`) — validate → smoke → regression → publish to Pages, gated on collection drift. `regression` (and therefore `publish-report`) runs on pull requests *and* on every push to `main`.
- **Nightly** (`.github/workflows/nightly.yml`) — full regression via Docker, published to GitHub Pages (manual trigger only, via `workflow_dispatch`).
- **Jenkins** (`Jenkinsfile`) — parameterized by environment and suite, with JUnit + HTML Publisher reporting.

### Enabling GitHub Pages

The `publish-report` job (`ci.yml`) and nightly workflow both deploy via
`actions/deploy-pages`, but GitHub Pages needs to be turned on once per repo
before that can succeed:

1. Repo **Settings → Pages**.
2. Under **Build and deployment → Source**, select **GitHub Actions** (not
   "Deploy from a branch").
3. Push to `main` (or run the nightly workflow manually) — the next
   successful `publish-report` / `full-regression` job will deploy, and the
   Pages URL (`https://libin-samkutty.github.io/postman-newman-automation/`)
   goes live.

No separate `gh-pages` branch is committed. `npm run test:docker` (what both
CI and nightly use) writes a single flat `reports/regression-report.html`,
so both publish jobs generate a small `reports/index.html` redirect to that
file before deploying — that's what the Pages root URL actually serves.
(`run-regression.sh`, used by `npm run test:regression` locally, writes into
timestamped `reports/<timestamp>/` folders instead — that path isn't used
by these two workflows.)

## Reporting stack

| Tool | Purpose | Output |
|------|---------|--------|
| newman-reporter-htmlextra | Rich HTML report with pass/fail per request | `reports/*.html` |
| newman-reporter-junit | JUnit XML for Jenkins integration | `reports/*.xml` |
| GitHub Actions artefact | CI report storage | 7-day retention |
| GitHub Pages | Persistent report hosting | Auto-deployed on merge |
| Jenkins HTML Publisher | Jenkins report tab | Linked in build |
