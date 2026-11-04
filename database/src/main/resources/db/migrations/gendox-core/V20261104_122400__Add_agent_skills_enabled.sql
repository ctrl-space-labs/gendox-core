-- #517 Skills on/off: a skill switched off stays on the agent with its text,
-- but completions and read_skill leave it out. Existing skills stay on.
ALTER TABLE gendox_core.agent_skills
    ADD COLUMN IF NOT EXISTS enabled BOOLEAN NOT NULL DEFAULT TRUE;