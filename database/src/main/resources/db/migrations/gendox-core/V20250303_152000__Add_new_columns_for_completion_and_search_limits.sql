-- Add new columns for completion and search limits
ALTER TABLE gendox_core.project_agent
    ADD COLUMN IF NOT EXISTS max_search_limit INTEGER DEFAULT 5;

ALTER TABLE gendox_core.project_agent
    ADD COLUMN IF NOT EXISTS max_completion_limit INTEGER DEFAULT 5;

ALTER TABLE gendox_core.message_section
    ADD COLUMN IF NOT EXISTS is_completion_participant BOOLEAN;

-- Set is_completion_participant to true for all existing message sections
UPDATE gendox_core.message_section
SET is_completion_participant = TRUE
WHERE is_completion_participant IS NULL;
