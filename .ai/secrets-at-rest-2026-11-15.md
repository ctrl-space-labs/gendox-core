# SEC-1 — secrets at rest

Plan for a task of the [agentic platform roadmap](agentic-platform-roadmap-2026-11-10.md). It is a prerequisite of
CONN-1 (connections with stored credentials) and replaces the API-keys part of GOV-5.

This file is self-contained and replaces the [original plan of 2026-11-13](secrets-at-rest-2026-11-13.md), which is
kept unchanged. What changed since the original:

- **One level of keys, not two.** The data-key table, the wrapping and the key states are gone. A key is 32 bytes, and a provider is only a way to load it.
- **The API key is looked up by a hash column**, so it is encrypted like every other secret. The deterministic converter is gone.
- **One procedure for every change of key**, with the same steps in every case.
- **Few classes.** One class holds the keys and the cipher, and a converter is put on the field.
- **The connector config stays `jsonb`.** Its encrypted value is stored as a JSON string.
- **Moving values to a new key is a Spring Batch job**, started by the API or from the command line. It is the first maintenance job, and the way such jobs run from now on.

**Status:** implemented and in review, on the branch `feature-agent-platform-roadmap`; not in `main` yet. The migration can run on an environment before its code is deployed: the code already there keeps working.

**Goal:** every secret Gendox stores can be encrypted in the database and read again by the application. Where the
encryption key comes from is a deployment choice: the configuration, a file on the host, or AWS KMS. Changing a key
is one procedure that cannot lose data.

**Not a goal:**

- Secrets given to the application as configuration (the provider keys in environment variables). They stay where they are.
- Encrypting documents, messages or other content.
- A key per organization, or customer-held keys.

## Decisions

| | Question | Outcome |
|---|---|---|
| S1 | One treatment or two (hash for keys Gendox only checks, encryption for keys it uses) | **One.** Every secret is encrypted two-way. A person with the right permission can see a key again. |
| S2 | Where encryption happens | A JPA attribute converter on the field: `@Convert(converter = EncryptedStringConverter.class)`. The code that uses the field does not change. |
| S3 | Cipher | AES-256-GCM, with a random nonce per value. One cipher and one stored format for every secret. |
| S4 | Keys | **One level.** A list of keys in the configuration; the first encrypts new values, the others only read. Each entry says which provider loads the key. |
| S5 | How an API key is found when a request presents it | By `api_key_hash`, the SHA-256 of the key, in its own indexed column. The lookup does not depend on the encryption key. |
| S6 | Any change of key or provider | **One procedure:** add the new key first in the list, restart, run the re-encryption job, remove the old key when nothing is on it. |
| S7 | How the stored values are read and written as they are stored | One class, `SecretColumnRepository`, with three SQL statements for every encrypted column. The columns are found from the entities' annotations. |
| S8 | How the re-encryption runs | A Spring Batch job, `secretsReencryptJob`, with a chunk-oriented step. |

S1 has one cost, accepted: whoever holds both the database and the key can recover the API keys, which a hash alone
would not allow. #561 describes the earlier approach (stored as a hash, shown once) and no longer matches.

### Why one level of keys

The first design had a data key in the database, wrapped by a master key held by the provider. That second level is
only needed to avoid calling AWS KMS for every value, and it was imposed on every provider. It also made two things
untrue: the configuration still had to list an old key during a change, and `rotate` did not cover a change of master
key.

Now the KMS case stays inside the KMS provider: the configured entry is a key that KMS has encrypted, and KMS
decrypts it once at startup. Every provider gives the application the same thing, 32 bytes.

What this costs: every change of key is a configuration change and a restart, and the operator creates the key.

### Why a hash column for the API key

The first design encrypted the API key deterministically, to search the encrypted column. That needed a second
converter, a second stored format and a second algorithm, and the lookup depended on the encryption key: it had to
try every key during a change, and native SQL queries that match on the key do not go through a converter at all.

With the hash column the lookup is the same before, during and after any change of key, and the API key column is
an ordinary encrypted secret. The API keys are long and random, so a plain SHA-256 is enough.

## Scope

The kinds of secret covered: Gendox API keys, an organization's model-provider keys, credentials of connectors and
integrations, the organization's private signing key, and the OAuth tokens CONN-1 will add. A field is in scope when
it carries the converter; the inventory and its reasons are kept in the private tracker.

## Design

### 1. The converter

```java
@Convert(converter = EncryptedStringConverter.class)
private String key;
```

- Encrypts when the entity is written, decrypts when it is read. Code that uses the field sees the plain value.
- It is a Spring bean, so the cipher is injected. Hibernate takes it from the Spring context.
- The column is text. For a field that holds JSON in a `jsonb` column there is `EncryptedJsonConverter`: the whole JSON value is encrypted and stored as a JSON string, so the column stays `jsonb`. This applies to one column; nothing filters on its content in SQL.
- Nothing can search an encrypted column by value. A secret that must be found by its value gets a hash column, as the API key does.

The entity shows the plain value. The status, the re-encryption and the startup check need the value as it is stored,
so `SecretColumnRepository` runs three SQL statements on every encrypted column: count the values per key, find the
next values that are not on the current key, and replace one value if it is still the one that was read.

- The encrypted columns are the entity fields that carry one of the two converters, with the table, id and column names of their annotations. A new encrypted field needs nothing more, and cannot be forgotten.
- The names in the SQL come from the annotations, never from a request; the values are bound as parameters.
- These statements are used only by the status, the re-encryption job and the startup check. The application reads and writes secrets through the entities.
- The statements were first written out in each entity's repository, three per repository behind an interface. That was the same three statements five times, about 200 lines, and a new field needed them again; it was replaced by the one class.

### 2. The stored value

```
enc:v1:<key id>:<base64 of nonce + ciphertext + tag>
```

- `v1` names the algorithm, so it can change later.
- The key id says which key encrypted the value. Nothing else is needed to read it.
- The cipher authenticates the value: a changed or truncated one fails to decrypt instead of returning garbage.
- A value without the prefix is read as it is.
- A secret that itself starts with the prefix is refused when it is saved.

### 3. The keys

A key is 32 bytes. Its id is a fingerprint of those bytes (16 hex characters), so keys are not named by hand and a
key cannot be listed under the wrong name.

`gendox.secrets.keys` (the environment variable `GENDOX_SECRETS_KEYS`) is a comma-separated list of
`<provider>:<reference>`. The first key encrypts new values. Every key in the list can decrypt what it encrypted
before.

| Provider | The reference is | The key is |
|---|---|---|
| `env` | the key itself, in base64 | the reference |
| `file` | a path on the host, such as a Docker or VM secret | the content of the file, in base64 |
| `aws-kms` | a key encrypted by AWS KMS, in base64, as `aws kms generate-data-key` returns it | what KMS returns when it decrypts the reference: one call per key at startup, none per value |

- A list can mix providers, which is what makes a change of provider the same procedure as any other change.
- The KMS ciphertext names its own KMS key, so the `aws-kms` provider needs only the default AWS region and credentials. KMS is not contacted unless a key uses it.
- When AWS rotates the KMS key (its automatic rotation), nothing is to be done: KMS still decrypts what earlier versions encrypted.
- An entry that cannot be loaded stops the startup, with its position in the list. The entry is never written to a log, because for `env` it is the key.

All of this is one class, `SecretCipher`: the three providers are three cases of one `switch`. Another key service
(Google Cloud KMS, Azure Key Vault, HashiCorp Vault) is one more case, added when someone needs it.

### 4. Finding an API key

- `api_keys.api_key_hash` holds the SHA-256 of the key in hex, with an index. The entity sets it whenever the key is set.
- A presented key is hashed and looked up by the hash, in the repository and in the two native queries that matched on the key.
- The hash is not returned by the API.
- The migration fills the column for existing rows with the same function in SQL.
- The column allows null, so that the code deployed before this change keeps creating keys after the migration has run. Those keys have no hash until the new code starts: on startup it fills every missing hash.

### 5. Changing a key: the one procedure

| Step | |
|---|---|
| 1 | Put the new key first in `gendox.secrets.keys`. Keep the others. |
| 2 | Restart. New values are written with the new key; everything else is still read with the key it names. |
| 3 | Run the job `secretsReencryptJob`: `POST /secrets/reencrypt` starts it in the background, or it runs from the command line (section 7). Every value that is not on the current key is moved to it. |
| 4 | `GET /secrets/status` shows, per key, how many values it holds. When an old key holds none, remove it from the list. |

It is the same four steps for every reason:

| Situation | The new key is |
|---|---|
| Encryption is turned on for a database that has values already | the first key |
| Routine rotation | a new key of the same provider |
| A key may have leaked | a new key |
| Another provider, for example from `env` to `aws-kms` | a key of the new provider |

Both endpoints are for platform administrators only. Neither returns a secret or a key: only key ids and counts.

### 6. What keeps it safe

- **It cannot leave values unreadable.** Each value is read with the key it names, written with the current one, and only if nobody changed it meanwhile. The job commits every 100 values. A run that stops halfway, or two runs at once, leave values that all still decrypt. Running it again continues.
- **A key cannot be removed too early without being told.** At startup the application counts the stored values per key id. If a value names a key that the list does not have, the application does not start, and it names the key.
- **Re-encryption changes the value and nothing else.** It writes the column with a native query, so the audit fields of the row (`updated_at`, `updated_by`) stay as they were.
- **Several instances.** A value written with the old key by an instance that has not restarted yet is moved by the next run; the status shows how many are left.
- **Nothing secret is logged.** Counts and key ids only.

### 7. Maintenance jobs

Re-encryption is the first job of a kind that will come again: long-running work on the data that is run by an
operator, not by a user. From now on such work is a Spring Batch job, and it has two ways to start.

- **By the API.** An endpoint for platform administrators starts the job. It runs in the background, and the answer is the id and the status of the job execution.
- **From the command line.** The application starts, runs the one job and stops. The exit code is 0 when the job completed.

```bash
java -jar gendox-core-api.jar --spring.batch.job.name=secretsReencryptJob --server.port=0
mvn spring-boot:run -Dspring-boot.run.arguments="--spring.batch.job.name=secretsReencryptJob --server.port=0"
```

- `spring.batch.job.name` is the property Spring Boot uses for this. The application configures Spring Batch itself, so Spring Boot's own runner is off, and `SpringBatchConfiguration#run` does the same thing: it finds the job by its name, waits for it and exits.
- Arguments of the form `name=value` become job parameters.
- The run needs the same environment as a normal start. It starts the whole application, the web server included, so `--server.port=0` keeps it away from the port of a running instance.
- The step is chunk-oriented: a reader, a writer, a commit per chunk. The read and write counts of every run are kept in the Spring Batch tables.

### 8. The API keys screen (v2)

- An API key is returned masked, as its last four characters, by every call except two: creating a key, and `POST organizations/{o}/api-keys/{id}/reveal`.
- The masking is on the entity's JSON form, so an endpoint that returns an API key shows it masked without doing anything.
- `reveal` is for members who may manage keys, and each call is written to the audit log.
- The list shows the last four characters. "Reveal" opens the key in a dialog with a Copy button. It replaces the "Copy key" button of the list, which needed the full key in the list.

## Files touched

- New: `SecretCipher` (keys and cipher), `EncryptedStringConverter`, `EncryptedJsonConverter`, `SecretColumnRepository` (the encrypted columns as stored), `SecretsService` (status, starting the job, startup checks), `SecretsController`.
- New, the job: `SecretsReencryptJobConfig` with its reader and writer, under `spring/batch/jobs/secretsReencrypt`.
- Changed in the API: the entities in scope (one annotation each; `ApiKey` also gets the hash and the masking), `ApiKeyRepository` (lookup by hash), `ApiKeyService`, `ApiKeyController` (reveal), the two native queries that matched on the API key with their callers, and `SpringBatchConfiguration` (the command-line run).
- Changed in `gendox-frontend-v2`: the API keys page, its service and the URL list.
- Migration: the `api_key_hash` column, filled and indexed; text columns for two secrets that were `varchar`; the audit log type of a reveal. Every statement can run again.
- Dependency: the AWS SDK KMS client, in the version of the AWS SDK already used.
- Documentation: a maintenance page on the key list, creating a key per provider and changing it; the reveal step in the user manual's API keys section.
- The ephemeral compose file passes `GENDOX_SECRETS_KEYS` to the API. No application configuration file changed: the property is read from the environment variable.

## Verification

Done:

- Unit tests: the reader of the job goes through every page of every column; the writer replaces the value it read; the JSON converter stores a JSON string; round trip; a different stored value each time; a changed or truncated value is rejected; a value without the prefix is read; an older key still reads its values; a value of a key that is not listed names the key; the same key id from each of the three providers (KMS mocked); errors that never quote an entry; the masked and revealed JSON of an API key; the hash against a published SHA-256 value.
- On an ephemeral database, with rows that existed before the migration:
  - the migration fills the hash, and a pre-existing API key still authenticates;
  - a key is configured: everything still reads, a new API key is stored encrypted, the job moves the rest, and `updated_at` does not change;
  - another key is put first: everything still reads before and after the job, and the old key then holds nothing and is removed;
  - the job started by the API, by the jar and by `mvn spring-boot:run`: the values move, and the two command-line runs exit with 0;
  - a connector written through the API is a JSON string in the `jsonb` column and reads back the same; one stored as a JSON object is read, and the job encrypts it;
  - the migration run twice more on a migrated database changes nothing;
  - the application refuses to start when the list lacks a key that values name, and names it;
  - the endpoints answer to a platform administrator only; a reveal of another organization's key is refused.
- In a browser: the list shows only the last four characters and its response holds no full key; Reveal shows the key and Copy puts it on the clipboard.
- In `gendox-e2e-tests`, on an ephemeral stack with a key configured (`@p2`, not smoke):
  - API (`tests/regression/api-keys.api.spec.js`): a key is in full when created and revealed, masked in the list and after a rename, and the revealed key authenticates; an administrator can reveal, an editor and a reader cannot; a key cannot be revealed through another organization.
  - Browser (`tests/v2/regression/api-keys.spec.js`): a new key is shown once, then masked after a reload, and Reveal shows it again; an editor sees no Reveal button.
- Code older than the migration: a key stored without a hash, as that code stores one, cannot be found by the new code until it starts; on startup its hash is filled and the key authenticates.

Still to do:

- An API test of a request with an API key before, during and after a change of key. It needs the stack restarted with another key list, which the suite cannot do yet.
- The `aws-kms` provider against a real KMS key.
- A chat completion that reaches a provider with an organization's own key, after a change of key.
- Once this is in `main` and every environment has started the new code: remove the startup fill of missing hashes, and make `api_key_hash` NOT NULL in a new migration.

## Open points

| | Question | Proposal |
|---|---|---|
| P1 | The index on `api_key_hash` is not unique. | Decided: it stays not unique. |
| P2 | A command-line run starts the whole application: the web server, the schedulers and the listeners run for the seconds the job takes. Starting without the web server fails today, because of beans that need it. | Accept it for now. A profile that starts only what a job needs is a separate task. |
| P3 | Who may call `reveal` with an API key. | Decided: an API key acts as an administrator of its organization, so `reveal` follows the same permission as for an administrator. |
