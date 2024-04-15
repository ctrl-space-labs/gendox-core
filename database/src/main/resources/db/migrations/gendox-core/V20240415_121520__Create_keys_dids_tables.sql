-------------- Create table for Gendox ----------------
-- Table to store registered AI Agent SSI did:key
CREATE TABLE IF NOT EXISTS gendox_core.wallet_keys
(
    id          UUID                 DEFAULT uuid_generate_v4(),
    organization_id     UUID        NOT NULL, --this is the external system id, eg, the Gendox's Agent User id (UUID)
    private_key TEXT        NOT NULL,
    key_type_id BIGINT        NOT NULL, -- EdDSA_Ed25519, ECDSA_Secp256k1, ECDSA_Secp256r1, RSA
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by  UUID        NOT NULL,
    updated_by  UUID        NOT NULL,

    PRIMARY KEY (id),
    FOREIGN KEY (organization_id) REFERENCES gendox_core.organizations (id),
    FOREIGN KEY (key_type_id) REFERENCES gendox_core.types (id)
);


-- Table to store user's DID (a user can be both human and AI Agent)
CREATE TABLE IF NOT EXISTS gendox_core.organization_dids
(
    id         UUID                 DEFAULT uuid_generate_v4(),
    organization_id UUID        NOT NULL,
    key_id     UUID        NULL,     --this is the id of the key in the wallet_keys table, if null, then ProvenAI will not be able to sign credentials on behalf of the user
    did        TEXT        NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (id),
    FOREIGN KEY (organization_id) REFERENCES gendox_core.organizations (id)
);


