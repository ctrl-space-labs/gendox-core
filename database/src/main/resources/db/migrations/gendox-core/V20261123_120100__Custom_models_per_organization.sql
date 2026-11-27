-- #597: an organization adds its own providers, each an endpoint that speaks a supported API, and its own models on them.
-- Every statement can run again on a database that already has the change.

-- A provider of an organization: its models are called at base_url, with the organization's model key for it.
-- Gendox's own providers keep both null.
ALTER TABLE gendox_core.ai_model_providers
    ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES gendox_core.organizations (id),
    ADD COLUMN IF NOT EXISTS base_url text;

-- Keys and models find a provider by its name, so an organization's provider names do not repeat.
CREATE UNIQUE INDEX IF NOT EXISTS ux_ai_model_providers_organization_name
    ON gendox_core.ai_model_providers (organization_id, name)
    WHERE organization_id IS NOT NULL;

-- A model is chosen by its name, so an organization's model names do not repeat.
CREATE UNIQUE INDEX IF NOT EXISTS ux_ai_models_organization_name
    ON gendox_core.ai_models (organization_id, name)
    WHERE organization_id IS NOT NULL;
