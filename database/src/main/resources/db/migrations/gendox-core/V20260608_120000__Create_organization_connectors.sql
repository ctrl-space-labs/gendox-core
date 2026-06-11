-- Seed connector type values first, so the FK on the new table can be satisfied immediately.
INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'CONNECTOR_TYPE', 'GOOGLE_EARTH_ENGINE', 'Google Earth Engine connector. config payload: { projectId: string }'
WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.types
    WHERE type_category = 'CONNECTOR_TYPE' AND name = 'GOOGLE_EARTH_ENGINE'
);

CREATE TABLE IF NOT EXISTS gendox_core.organization_connectors (
    id                 UUID         NOT NULL,
    organization_id    UUID         NOT NULL,
    connector_type_id  BIGINT       NOT NULL,
    is_active          BOOLEAN      NOT NULL DEFAULT TRUE,
    config             JSONB        NOT NULL DEFAULT '{}'::jsonb,
    created_at         TIMESTAMP,
    updated_at         TIMESTAMP,
    created_by         UUID,
    updated_by         UUID,
    PRIMARY KEY (id),
    CONSTRAINT fk_org_connectors_organization
        FOREIGN KEY (organization_id) REFERENCES gendox_core.organizations(id) ON DELETE CASCADE,
    CONSTRAINT fk_org_connectors_type
        FOREIGN KEY (connector_type_id) REFERENCES gendox_core.types(id),
    CONSTRAINT uq_org_connectors_org_type UNIQUE (organization_id, connector_type_id)
);

CREATE INDEX IF NOT EXISTS idx_org_connectors_org_id
    ON gendox_core.organization_connectors(organization_id);

CREATE INDEX IF NOT EXISTS idx_org_connectors_type_id
    ON gendox_core.organization_connectors(connector_type_id);
