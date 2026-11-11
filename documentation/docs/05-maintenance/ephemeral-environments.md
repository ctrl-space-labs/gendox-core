---
sidebar_position: 3
title: Local test environments
description: Run a complete, disposable Gendox stack (database, API, Keycloak and web app) on your machine with Docker Compose, one per checkout, for development, testing and coding agents.
---

# Local test environments (ephemeral)

An **ephemeral environment** is a complete Gendox stack on your own machine: PostgreSQL with pgvector, the API, Keycloak for sign-in, and the web app. Each checkout of the repository (or git worktree) gets its own, with its own ports, so several can run side by side. It is plain Docker Compose, in `gendox-compose-scripts/ephemeral/`.

It is meant for development, manual testing, the [end-to-end tests](./e2e-tests.md) and AI coding agents. Nothing in it is important: it can always be rebuilt.

## Requirements

- Docker with Compose. One stack uses about 1.1 GB of memory after start-up.
- Java and Maven to build the API, Node.js and Yarn to build the web app.

## Start

From `gendox-compose-scripts/ephemeral/`:

```bash
./init-env.sh
```

Writes `.env` with a name (`gendox-eph-<folder>`) and four free ports. Run it once per checkout.

```bash
docker compose up -d --wait
```

Starts the stack. The first start takes about a minute; later ones a few seconds.

The ports follow a *slot* number `NN` chosen by `init-env.sh`:

| Service | Address |
|---|---|
| Web app | `http://localhost:31NN` |
| API | `http://localhost:81NN/gendox/api/v1` |
| Keycloak | `http://localhost:85NN/idp` |
| Database | `localhost:55NN` |

Everything listens on `127.0.0.1` only. The exact ports are in `.env`.

## What's inside

- A fresh database with every migration applied, including demo and test data: seeded organizations, agents and test users. The test users and their password are listed in the folder's `README.md`.
- **Mock AI models** (`mock-gemini-2.0-flash`, `mock-gemini-embedding`) that answer without any provider key and cost nothing. Use them for agents and tasks you test.
- To try real models, fill in the provider keys (`OPENAI_KEY`, `GEMINI_KEY`, `ANTHROPIC_KEY`, …) in `.env` and run `docker compose up -d --wait` again. Real models are billed per call.

## After changing code

The stack runs the code built in your checkout:

| You changed | Run |
|---|---|
| The API | `mvn -q package -DskipTests` in `gendox-core-api`, then `docker compose restart api` |
| The web app | `yarn build` in `gendox-frontend-v2`, then `docker compose restart frontend` |
| Database migrations | `docker compose up -d --wait` (migrations run on every start) |

> If the web app answers **403 Forbidden** after a build, restart the `frontend` container: the build replaces the `out/` folder and the container must pick up the new one.

## Everyday commands

| Purpose | Command |
|---|---|
| Stop, keeping all data | `docker compose stop` |
| Logs | `docker compose logs -f api` (or `db`, `keycloak`, `flyway`, `frontend`) |
| Every environment on this machine | `docker compose ls -a --filter name=gendox-eph` |
| Delete it and its data | `docker compose down -v` |

Deleting is safe in the sense that the environment can be rebuilt, but it loses everything you created in it. Coding agents must ask before deleting one.

## Branches and migrations

Migrations run on every `up`, so the database follows the branch you have checked out. If an already-applied migration was edited, or the Keycloak realm file changed, `up` fails or the change is ignored: rebuild the environment with `docker compose down -v` and `docker compose up -d --wait`.
