# Ephemeral environments for coding agents and local e2e

Implemented and verified locally. The usage guide is `gendox-compose-scripts/ephemeral/README.md`.

## Goal

Most code is now written by coding agents, so the bottleneck is getting a clean stack to test on and
throwing it away afterwards. Three things were asked for: faster startup, a good way to define and
name an agent environment, and an e2e run that creates everything and deletes it at the end.

## Naming

The umbrella term in the industry is **ephemeral environment**. "Preview environment" usually means
one hosted per pull request, and "sandbox" now mostly means isolating the agent itself for security,
which this does not do. So: folder `gendox-compose-scripts/ephemeral/`, instances `gendox-eph-<slug>`,
and a `dev.ctrlspace.gendox.ephemeral` label on every container. The name is a contract: anything
`gendox-eph-*` may be destroyed at any time without asking.

## Where the old startup time went

Measured on a restart of the previous stack, which reused an existing volume:

| Step | Cost | Cause |
|---|---|---|
| Keycloak waiting for the database | about 11 s | Waited on `flyway_schema_history`, so on a new volume it waited for all migrations too. |
| Keycloak rebuilding itself | about 6 s | Build options were passed at `start`, not at `build`. |
| Keycloak setup script | about 19 s | One new JVM per `kcadm.sh` call. |
| API startup | about 19 s | Normal Spring startup. |

A first boot also ran `mvn clean install flyway:migrate` inside Postgres, downloading its plugins on
every new volume.

## Decisions

- **Bake the database, don't template it.** `env.sh` boots Postgres and Keycloak once, runs Flyway
  and the realm import, stops them cleanly and commits the container as `gendox-eph-db:<hash>`, with
  the data in `/pgdata`, outside the image's `VOLUME`. Each environment gets a private copy with no
  shared server. This replaces the `CREATE DATABASE ... TEMPLATE` idea from the proposal, because it
  covers Keycloak's slow schema setup too and leaves nothing shared between environments.
- **Realm as a JSON file, loaded by `--import-realm`.** No `kcadm`. Readiness now means the realm
  exists, which removes a race where the API could start before it did.
- **Plain HTTP between services and to the browser.** Removes the keystore, the truststore step and
  the network alias, and needed no change to shared config: `application-ephemeral.yml` overrides it.
- **Jar from a mounted directory.** A directory, because Maven replaces the file and a single-file
  mount would keep the old one. Removes the need for an image build and the stale-image trap.
- **Frontend URLs at runtime.** `/env-config.js` sets `window.__GENDOX_ENV__`, and `common.config.js`
  prefers it over the values inlined at build time. It is empty by default, so other deployments
  behave as before. Without this, every port would need its own frontend build.
- **Shared files left alone** except the frontend's `Dockerfile` (BuildKit cache mounts). The other
  stacks keep using `gendox-keycloak/Dockerfile`.

## Rejected after measuring

- **Lazy Spring initialization:** 24 s to 23 s on a full `up`, in exchange for wiring errors appearing
  on the first request instead of at startup.
- **Java AOT cache:** not built. It needs a training run per jar, and the jar changes on every edit
  and every e2e run, so the training run costs about what it saves.

## Results

| Scenario | Time |
|---|---|
| Full new environment, images cached | 24 s |
| e2e from nothing to deleted, images cached, including `npm ci` | 1 m 15 s |
| `reload` (jar rebuild and API restart) | 21 s |
| Baking the database image | about 1 min, once per migration or realm change |
| Frontend image, cold | about 5 min, once per frontend change |

Also verified: two environments created at the same time get different slots, a browser login works
in each, an interrupted e2e run leaves no containers or volumes, and `migrate` changes only its target.

## The API tests

`tests/api-tests` was rewritten for the current API and now passes with no provider keys:

- Routes follow the current `/organizations/{org}/projects/{project}/...` structure.
- Role tests log in as the seeded user holding that role. Before, one user ran the admin, editor and
  reader tests alike, and the "denied" tests only passed because their old routes returned 404.
- Access denied is answered as 404 by design, so that is what the denial tests assert.
- Tests that change a project use one created through the API, whose agent has all required fields.
- Search, completions and embeddings run on the mock models. The separate Cohere and OpenAI tests were
  identical requests, so they became one test each.
- Removed: `POST /embeddings` no longer exists, so its test became `Get Section Embedding`. Creating a
  user requires a super admin, and none is seeded, so only the denial is tested.
