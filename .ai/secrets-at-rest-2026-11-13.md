# SEC-1 — secrets at rest

Plan for a new task of the [agentic platform roadmap](agentic-platform-roadmap-2026-11-10.md). It is a prerequisite of
CONN-1 (connections with stored credentials) and replaces the API-keys part of GOV-5.

**Status:** design agreed on 2026-11-13 and revised twice the same day in review: no second column for API keys;
one key model for every provider and one rotation operation. Nothing is implemented.

**Goal:** every secret Gendox stores can be encrypted in the database and read again by the application. Where the
encryption key comes from is a deployment choice: an environment variable or file on the host, AWS KMS, or another
key service. Changing or rotating keys is one operation that cannot lose data.

**Not a goal:**

- Secrets given to the application as configuration (the provider keys in environment variables). They stay where they are.
- Encrypting documents, messages or other content.
- A key per organization, or customer-held keys. The design leaves room for them and builds neither.

## Decisions

| | Question | Outcome |
|---|---|---|
| S1 | One treatment or two (hash for keys Gendox only checks, encryption for keys it uses) | **One.** Every secret is encrypted two-way. A person with the right permission can see a key again. |
| S2 | Where encryption happens | A JPA attribute converter on the field: `@Convert(converter = …)`. Services and controllers do not change. |
| S3 | Cipher | AES-256, authenticated. A random nonce per value, except the API key (S5). |
| S4 | Keys | Two levels, the same for every provider. A **data key** encrypts the values and is stored in the database, wrapped. A **master key**, held by the provider, only wraps data keys. |
| S5 | How an API key is found when a request presents it | The API key field is encrypted deterministically, so the presented key is encrypted and searched in the same column. No second column. |
| S6 | Rotation and any change of key or provider | **One operation, `rotate`**, the same in every case. |

S1 has one cost, accepted: whoever holds both the database and the master key can recover the API keys, which a
hash would not allow. #561 describes the earlier approach (stored as a hash, shown once) and no longer matches.

## Scope

The kinds of secret covered: Gendox API keys, an organization's model-provider keys, credentials of connectors and
integrations, and the OAuth tokens CONN-1 will add. The inventory of fields is kept in the private tracker.

## Design

### 1. The converter

```java
@Convert(converter = EncryptedStringConverter.class)
private String key;
```

- Encrypts when the entity is written, decrypts when it is read. Code that uses the field sees the plain value, as today.
- It is a Spring bean, so it gets the cipher injected. To confirm with the Hibernate version in use.
- A field mapped as JSON cannot take the converter as it is. Proposal: such a column becomes text and the whole value is encrypted, unless something filters on its content in SQL; to check per field.

### 2. The stored value

```
enc:v1:<data key id>:<base64 of nonce + ciphertext + tag>
```

- `v1` names the algorithm, so it can change later.
- The data key id says which key encrypted the value. Nothing else is needed to read it.
- The cipher authenticates the value: a changed or truncated one fails to decrypt instead of returning garbage.
- A value without a prefix is read as it is.

### 3. The two keys

| | Data key | Master key |
|---|---|---|
| What it does | Encrypts and decrypts the stored values, in the JVM | Wraps and unwraps data keys. It never sees a value. |
| Where it lives | In the database, wrapped, one row per key | With the provider: an environment variable or mounted file, or inside AWS KMS |
| Who creates it | Gendox | The operator, or AWS |

The data keys are in one table, and that table is what tells the keys apart:

```
secret_data_keys
  id              the id written into every value it encrypted
  provider        env | aws-kms
  master_key_ref  which master key wrapped it: the KMS key ARN, or a fingerprint of the env key
  wrapped_key     the data key, encrypted by that master key
  state           current | previous | retired
  created_at, retired_at
```

Reading a value is always the same path: the value names its data key, the row names the provider and the master
key, the provider unwraps the data key once, and the unwrapped key is held in memory. Configuration never lists old
keys; the database describes itself.

```java
public interface KeyWrapper {                                // one class per provider
    String provider();
    String masterKeyRef();                                   // the master key that wraps new data keys
    byte[] wrap(byte[] dataKey);
    byte[] unwrap(String masterKeyRef, byte[] wrappedKey);
}
```

| Provider | Master key | Configuration (names only) |
|---|---|---|
| `env` | A key given to the application, from an environment variable or a file mounted on the host (a Docker or VM secret) | `GENDOX_SECRETS_KEY` or `GENDOX_SECRETS_KEY_FILE`; `GENDOX_SECRETS_PREVIOUS_KEY` only while a master key is being replaced |
| `aws-kms` | A KMS key. KMS is called to wrap a new data key and to unwrap one at first use: a handful of calls per start, none per value. | `GENDOX_SECRETS_KMS_KEY_ID`; AWS credentials from the default chain |

`gendox.secrets.provider` chooses which provider wraps **new** data keys. Every provider whose configuration is
present can still unwrap the data keys it wrapped before, which is what makes a change of provider possible.

Other key services fit the same two operations: Google Cloud KMS, Azure Key Vault, HashiCorp Vault Transit. Each is
one more `KeyWrapper`, written when someone needs it.

### 4. Finding an API key

A request presents an API key and Gendox must find its row. With a random nonce the same key encrypts to a different
value every time, so the column cannot be searched.

- The API key field uses a second converter, `SearchableEncryptedStringConverter`, which encrypts **deterministically**: the same key always gives the same stored value. Stored as `det:v1:<data key id>:<base64>`.
- The lookup stays `WHERE api_key = ?` on the existing column and its index: JPA passes the query parameter through the converter, so `findByApiKey` keeps working. The cost per request is one AES operation, in microseconds, and the same indexed lookup as today.
- Deterministic encryption shows when two stored values are equal. API keys are long, random and unique, so there is nothing to show. Every other secret keeps the random nonce.
- Algorithm: AES-GCM-SIV, which is built to stay safe when the nonce repeats. It is in Bouncy Castle, already a dependency; to confirm when built.
- A presented key that itself carries a stored-value prefix is rejected before the lookup.
- While a rotation is under way, the lookup tries the current data key and then the previous ones.

### 5. `rotate`: the one operation

An admin endpoint, for platform administrators only, written to the audit log. It does three things, in order:

1. Creates a new data key, wrapped by the configured provider, and makes it `current`. The one before becomes `previous`.
2. Re-saves every stored value that is not on the current data key, including values that carry no prefix.
3. For each `previous` data key, counts the values still on it. At zero the key becomes `retired`. Its row is kept.

It is the same operation whatever the reason, and the same whether the provider is `env` or `aws-kms`:

| Situation | What the operator does |
|---|---|
| Encryption is turned on for a database that has values already | Set the provider and its key, restart, run `rotate`. |
| Routine rotation | Run `rotate`. No configuration change, no restart. |
| AWS rotates the KMS key (its automatic rotation) | Nothing. KMS keeps the earlier versions of the key under the same id and still unwraps what they wrapped. |
| The master key is replaced: a new env key, another KMS key, or another provider | Set the new one, keep the old one readable (`GENDOX_SECRETS_PREVIOUS_KEY`, or the old KMS key left enabled), restart, run `rotate`. When the status shows nothing depends on the old master key, remove it. |

With `aws-kms`, a rotation asks KMS to wrap one new data key. The values themselves are re-encrypted in the JVM;
KMS is not called per value.

### 6. What keeps it safe

- **It cannot leave values unreadable.** Each value is re-saved in its own transaction: read with the key it names, written with the current one. A run that stops halfway leaves a mix of old and new values, and all of them decrypt. Running it again continues.
- **A key is never deleted by the application.** A data key is retired only after the count of values on it is zero, and its row stays.
- **A master key cannot be removed too early without being told.** At startup the application unwraps every data key that is not retired. If one cannot be unwrapped it does not start, and it names the data key and the master key it is missing.
- **Several instances.** Every instance takes the current data key from the table. Values written with the old key while a run is in progress are caught: step 2 repeats until its count is zero. One run at a time, under the existing scheduler lock.
- **A status endpoint** shows, per data key: state, provider, master key reference and number of values on it; and for each master key, whether anything still depends on it.
- **Nothing secret is logged.** Counts and key ids only.
- **A backup restores as a whole.** A database backup carries its own wrapped data keys, so it needs only the master key of its time.

### 7. The API keys screen (v2)

- The list shows a key masked, with its last four characters.
- "Reveal" calls a separate endpoint that returns the full key to members who may manage keys. The call is written to the audit log.
- Creating a key shows it in full, as today.

## Steps

| # | Step |
|---|---|
| SEC-1a | The cipher, the data-key table, the `env` provider, both converters on the fields in scope, `rotate` and the status endpoint, the startup check. |
| SEC-1b | The `aws-kms` provider. |
| SEC-1c | The v2 screen: masked keys and reveal. |

## Files touched

- New: `EncryptedStringConverter`, `SearchableEncryptedStringConverter`, `SecretCipher`, `KeyWrapper` with its providers, the data-key entity and repository, the rotation service and its controller.
- Changed: the entities in scope (one annotation each), `ApiKeyService` (prefix check, lookup during a rotation), the API keys controller (reveal), the compose files of each environment (the key's variable name).
- Migrations: the data-key table; a type change for JSON-mapped fields if section 1 confirms it. None for `api_keys`.
- Dependency: the AWS SDK KMS client (SEC-1b).
- No core file is touched.

## Verification

- Unit tests: round trip; a tampered value is rejected; a value without the prefix is read; the deterministic converter gives the same value twice and finds a row through the repository; the `aws-kms` provider against a mocked client.
- Rotation tests: a run over values on two data keys and with no prefix; a run stopped halfway, then run again; a value written with the old key during a run; a data key retired only at zero; startup refused when a master key is missing.
- API tests in `gendox-e2e-tests`: a request with an API key before, during and after a rotation; a revoked key; reveal with and without the permission.
- On the ephemeral stack: start with existing data, run `rotate`, restart, and check that a chat completion still reaches a provider with an organization's own key. Then replace the master key and repeat.

## Open points

| | Question | Proposal |
|---|---|---|
| P1 | AES-GCM-SIV through Bouncy Castle for the deterministic converter. | Confirm in SEC-1a with a test against published test vectors. |
| P2 | JSON-mapped fields. | Check per field whether anything filters on the content in SQL; if not, text column, whole value encrypted. |
