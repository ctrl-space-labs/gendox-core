---
sidebar_position: 5
title: Encryption of stored secrets
description: How Gendox encrypts the secrets it stores (API keys, model provider keys, connector and integration credentials, signing keys), how to create an encryption key, and how to change it.
---

# Encryption of stored secrets

Gendox stores secrets in its database: API keys, organizations' model provider keys, the credentials of connectors and integrations, and organizations' signing keys. Each one is encrypted with AES-256-GCM before it is written and decrypted when it is read. Whoever reads the database, or a copy of it, without the key sees only the encrypted values.

## The setting

The keys are given to the API in one environment variable, `GENDOX_SECRETS_KEYS` (Spring property `gendox.secrets.keys`). It is a comma-separated list. Each entry says where a key comes from, as `<provider>:<reference>`:

| Provider | Entry | Where the key is |
|---|---|---|
| `env` | `env:<key in base64>` | in the setting itself |
| `file` | `file:/path/to/key` | in a file on the API's host or container, holding the key in base64 |
| `aws-kms` | `aws-kms:<encrypted key in base64>` | encrypted by AWS KMS; the API asks KMS to decrypt it once, at startup |

A key is 32 random bytes. **The first key in the list encrypts new values.** The others only decrypt the values they encrypted before, so a key can be changed without losing anything.

```bash
GENDOX_SECRETS_KEYS=env:<new key>,file:/run/secrets/gendox-old-key
```

Each stored value names the key that encrypted it (a short fingerprint of the key, never the key). If stored values name a key that the list does not have, the API does not start, and its log names the missing key.

## Creating a key

### `env` or `file`

Generate 32 random bytes in base64:

```bash
openssl rand -base64 32
```

Put the output after `env:` in `GENDOX_SECRETS_KEYS`, or save it in a file that only the API can read and use `file:<path>`. With Docker, a [Docker secret](https://docs.docker.com/compose/how-tos/use-secrets/) mounted in the container and `file:/run/secrets/<name>` keeps the key out of the environment.

### `aws-kms`

1. In AWS KMS, create a **symmetric** key (key spec `SYMMETRIC_DEFAULT`, usage *Encrypt and decrypt*), or pick an existing one.
2. Ask KMS for a data key, encrypted by that KMS key:

   ```bash
   aws kms generate-data-key --key-id <KMS key ARN or alias> --key-spec AES_256 --query CiphertextBlob --output text
   ```

3. Put the output after `aws-kms:` in `GENDOX_SECRETS_KEYS`.
4. Give the API AWS credentials allowed `kms:Decrypt` on that KMS key, and the key's region in `AWS_REGION`. The API uses the standard AWS credentials chain: environment variables, a profile, or the role of the instance or container.

The encrypted data key names its KMS key, so nothing else is configured. When AWS rotates the KMS key automatically, nothing changes in Gendox.

## Changing a key

The same four steps for any reason: a routine rotation, a key that may have leaked, another provider, or a database that already holds values when encryption is set up.

1. Create a new key, and put it **first** in `GENDOX_SECRETS_KEYS`. Keep the old keys after it.
2. Restart the API. New values are now encrypted with the new key, and old values still read.
3. Run the job `secretsReencryptJob`, which moves every stored value to the first key. Values already on it are left as they are, so the job can be stopped and run again.
4. Check the status. When an old key holds no values, remove it from the list and restart.

Steps 3 and 4 need a [Super Admin](./administrator-guide.md#creating-a-gendox-super-admin) token:

```bash
curl -X POST -H "Authorization: Bearer <token>" https://<host>/gendox/api/v1/secrets/reencrypt
curl -H "Authorization: Bearer <token>" https://<host>/gendox/api/v1/secrets/status
```

The first starts the job in the background and returns its execution id. The second returns the current key and how many values each key holds, for example `{"currentKey": "3f2a…", "valuesPerKey": {"3f2a…": 42, "9c1d…": 0}}`. Neither returns a secret or a key.

The job can also run from the command line, with the same environment variables as the API. The application starts, runs the job, and exits with code 0 when it completed:

```bash
java -jar gendox-core-api.jar --spring.batch.job.name=secretsReencryptJob --server.port=0
```

`--server.port=0` keeps it off the port of an API that is already running.
