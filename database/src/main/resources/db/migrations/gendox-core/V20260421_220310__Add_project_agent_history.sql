CREATE TABLE IF NOT EXISTS gendox_historic_data.project_agent_history
(
    id                       uuid             NOT NULL,
    project_id               uuid             NOT NULL,
    semantic_search_model_id uuid,
    completion_model_id      uuid,
    agent_name               text             NOT NULL,
    agent_behavior           text,
    private_agent            boolean,
    created_at               timestamp,
    updated_at               timestamp,
    created_by               uuid,
    updated_by               uuid,
    document_splitter_type   bigint,
    chat_template_id         uuid,
    section_template_id      uuid,
    user_id                  uuid,
    max_token                bigint,
    temperature              double precision,
    top_p                    double precision,
    moderation_check         boolean,
    moderation_model_id      uuid,
    agent_vc_jwt             text,
    organization_did         text,
    max_search_limit         integer,
    max_completion_limit     integer,
    rerank_enable            boolean,
    rerank_model_id          uuid,
    advanced_search_enable   boolean,
    advanced_search_model_id uuid,
    recorded_at              timestamptz      NOT NULL DEFAULT now()
);

-- Create an index on the project_id column if it does not already exist
DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1
            FROM pg_class c
                     JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE c.relname = 'idx_project_agent_history_project_id'
              AND n.nspname = 'gendox_historic_data'
        ) THEN
            CREATE INDEX idx_project_agent_history_project_id
                ON gendox_historic_data.project_agent_history (project_id);
        END IF;
    END $$;

-- Baseline snapshot of all existing agents (only inserts agents not yet in history)
INSERT INTO gendox_historic_data.project_agent_history (
    id,
    project_id,
    semantic_search_model_id,
    completion_model_id,
    agent_name,
    agent_behavior,
    private_agent,
    created_at,
    updated_at,
    created_by,
    updated_by,
    document_splitter_type,
    chat_template_id,
    section_template_id,
    user_id,
    max_token,
    temperature,
    top_p,
    moderation_check,
    moderation_model_id,
    agent_vc_jwt,
    organization_did,
    max_search_limit,
    max_completion_limit,
    rerank_enable,
    rerank_model_id,
    advanced_search_enable,
    advanced_search_model_id,
    recorded_at
)
SELECT
    pa.id,
    pa.project_id,
    pa.semantic_search_model_id,
    pa.completion_model_id,
    pa.agent_name,
    pa.agent_behavior,
    pa.private_agent,
    pa.created_at,
    pa.updated_at,
    pa.created_by,
    pa.updated_by,
    pa.document_splitter_type,
    pa.chat_template_id,
    pa.section_template_id,
    pa.user_id,
    pa.max_token,
    pa.temperature,
    pa.top_p,
    pa.moderation_check,
    pa.moderation_model_id,
    pa.agent_vc_jwt,
    pa.organization_did,
    pa.max_search_limit,
    pa.max_completion_limit,
    pa.rerank_enable,
    pa.rerank_model_id,
    pa.advanced_search_enable,
    pa.advanced_search_model_id,
    NOW()
FROM gendox_core.project_agent pa
WHERE NOT EXISTS (
    SELECT 1 FROM gendox_historic_data.project_agent_history pah WHERE pah.id = pa.id
);
