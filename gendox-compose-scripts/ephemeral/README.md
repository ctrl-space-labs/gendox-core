# Ephemeral environments

A full Gendox stack (Postgres, Keycloak, API, frontend) for coding agents and local e2e
runs. Each checkout, the main one or a worktree, has its own. It is plain Docker Compose.

**The rule: environments named `gendox-eph-*` hold nothing important and can always be
rebuilt, but an agent always asks the user before deleting one.** Stopping one is fine.

## Use

All commands run from this folder.

```bash
./init-env.sh                  # once per checkout: writes .env with a name and free ports
docker compose up -d --wait    # start it, or apply this checkout's new migrations
```

| Purpose | Command |
|---|---|
| Start, or apply new migrations | `docker compose up -d --wait` |
| Stop, keeping all data | `docker compose stop` |
| Logs | `docker compose logs -f api` (`db`, `keycloak`, `flyway`, `frontend`) |
| Database shell | `docker compose exec db psql -h 127.0.0.1 -U gendox_user postgres` |
| All environments on this machine | `docker compose ls -a --filter name=gendox-eph` |
| Delete it and its data. **Ask the user first.** | `docker compose down -v` |

`init-env.sh` is the only script, because choosing free ports is the one thing Compose
cannot do. Writing `.env` by hand from `env.example` works as well. Without a `.env` nothing
starts, so a worktree cannot start on top of another checkout's environment.

## After changing code

| Changed | Run | Time |
|---|---|---|
| Backend | `mvn -q package -DskipTests` in `gendox-core-api`, then `docker compose restart api && docker compose up -d --wait` | about 25 s |
| Frontend | `yarn build` in `gendox-frontend-v2` (first `yarn install` in a new worktree) | about 35 s |
| Migrations | `docker compose up -d --wait` | a few seconds |
| Keycloak themes | `docker compose up -d --wait --build keycloak` | about a minute |

The API runs the jar in `gendox-core-api/target`, and nginx serves `gendox-frontend-v2/out`, both
mounted from this checkout. A new frontend build is live at once. The e2e tests warn when
either is older than its sources.

When working mostly on the UI, `yarn dev` on the host against this environment's API and
Keycloak URLs is faster than rebuilding.

## What's inside

- **URLs:** slot `NN` gives API `http://localhost:81NN/gendox/api/v1`, frontend
  `http://localhost:31NN`, Keycloak `http://localhost:85NN/idp`, database port `55NN`. They are
  bound to 127.0.0.1 only and are plain HTTP. This checkout's ports are in `.env`.
- **Users:** `testuser1@test.com` to `testuser4@test.com`, password `123456789`, hold the
  seeded organizations and projects. `model-test@test.com` has the same password and is in no
  organization. The realm is `gendox-idp-prod`.
- **A token without a browser** (client `gendox-dev-test-client` allows password login):

  ```bash
  curl -s -X POST "http://localhost:85NN/idp/realms/gendox-idp-prod/protocol/openid-connect/token" -d grant_type=password -d client_id=gendox-dev-test-client -d username=testuser1@test.com -d password=123456789 -d "scope=openid email"
  ```

- **Models:** point agents at `mock-gemini-2.0-flash` and `mock-gemini-embedding`: no key, no
  cost. For a real provider, fill in its key in `.env` and run `docker compose up -d --wait`.

## Data and branches

A new environment starts from an empty Postgres. Flyway applies every migration, including
`test-data` and `demo-data`, and Keycloak imports `keycloak/gendox-idp-prod-realm.json`. The
database is in a named volume, so it survives restarts and code updates.

Flyway runs on every `up`, so the environment follows whatever branch is checked out:

| Situation | Result |
|---|---|
| The branch adds a migration | Applied |
| Switching to a branch without it | Accepted, the applied change stays |
| The branch has a migration older than the latest applied | Applied |
| An applied migration was edited | `up` fails; see `docker compose logs flyway` |

The last case, a migration that fails, or a change to the realm file (Keycloak imports it
only into an empty database) means the environment has to be rebuilt: ask the user, then
`docker compose down -v` and `docker compose up -d --wait`.

## Limits

- Memory: one stack uses about 1.1 GB after startup, and the API heap can grow to 1 GB
  (`EPH_API_HEAP` in `.env`), so check Docker's limit before running many.
- Disk: if builds or containers fail with "no space left on device", look at
  `docker system df`.
- The first start takes about 50 s, a later `up` about 4 s.
- Editing the realm: Keycloak requires the file name `gendox-idp-prod-realm.json`. The
  redirect URI `http://localhost/*` matches any port, so the realm does not depend on the slot.
