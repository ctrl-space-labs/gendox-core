# local-development-test

Full Gendox stack for local development and testing, isolated from your existing
setup.

## Why this exists separately

Docker Compose namespaces named volumes by project directory, so the Postgres
volume here is `gendox-claude-test-env-to-delete_postgres-data`, not the one `dev-ci-installation`
uses. **Your existing local database cannot be touched from this directory**, including
by `docker compose down -v`. Every published port is shifted and every container
renamed, so both stacks can run at the same time.

| Service | This stack | dev-ci / build-ci |
|---|---|---|
| database | **5533** | 5433 |
| api | **8081** | 8080 |
| keycloak | **8543** | 8443 |
| frontend | **3100** | 3000 |

## Running it

```bash
cp env.local.example .env.local   # first time only
docker compose --env-file .env.local up -d
```

`--env-file` is required: Compose only auto-loads a file literally named `.env`.

```bash
docker compose --env-file .env.local down      # keeps the database
docker compose --env-file .env.local down -v   # wipes it, re-runs migrations
```

## Migrations

There is no migration service. `database/Dockerfile` copies
`docker-flyway-db-init.sh` into `/docker-entrypoint-initdb.d/`, and Postgres runs it
on **first boot of an empty data directory**, executing `mvn flyway:migrate` with
`flyway-local.conf` (which includes `demo-data` and `test-data`).

So to pick up a new migration you must `down -v`, not just restart. That is the
intended workflow here — cheap because nothing in this volume is precious.

## Test user

`gendox-keycloak/conf/gendox-local-init.sh` creates the realm and clients but no end
users. This stack bind-mounts `keycloak-init/gendox-test-users.sh`, which adds:

- user `model-test@test.com` / `123456789`
- client `gendox-dev-test-client` with direct access grants enabled, so tokens can be
  fetched without a browser

It is mounted rather than baked into the image, so editing it only needs a restart.

```bash
curl -sk -X POST https://localhost:8543/idp/realms/gendox-idp-prod/protocol/openid-connect/token \
  -d grant_type=password -d client_id=gendox-dev-test-client \
  -d username=model-test@test.com -d password=123456789 -d scope='openid email'
```

The user also needs a matching row in `gendox_core.users` on the same email for the
API to resolve the identity.

## Testing models without spending money

Point an agent at **`mock-gemini-2.0-flash`**. `MockGeminiServiceAdapter` returns a
canned completion *and* a canned reasoning summary, which exercises the whole
persist → normalize → render path — including the thinking panel — with no API key and
no cost. Use it for everything except verifying a specific provider's wire format.

When you do need a real provider, put the key in `.env.local` and prefer the cheapest
model of that family. `.env.local` is gitignored (`.gitignore` covers `.env*`, and no
`.env*` file is tracked anywhere in this repo). Never `git add -f` it.

## Notes

- `application-docker-local.yml` hardcodes `https://gendox-keycloak:8443` with no env
  placeholder, so the Keycloak service here carries a network **alias** of
  `gendox-keycloak` alongside its real name `gendox-claude-test-env-to-delete-keycloak`. The generated
  self-signed cert covers both names. Don't remove the alias without also
  parameterising that config.
- `local-tests-installation/docker-compose-with-tests.yml` is a different, older file
  and is currently broken: it targets container port 5000 while the app listens on
  8080, so its healthcheck never passes and the e2e container never starts. It also
  has no Keycloak and no volumes. Not a basis for this stack.
