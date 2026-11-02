-- How a chat agent searches the project's documents, always with the advanced_search tool (#542).
--   ALWAYS: the first model call of each turn must call a tool, where the provider allows it.
--   AUTO:   the agent is told to search before answering questions about the documents.
--   OFF:    no search.
ALTER TABLE gendox_core.project_agent ADD COLUMN IF NOT EXISTS advanced_search_mode varchar(16) NOT NULL DEFAULT 'ALWAYS'
    CHECK (advanced_search_mode IN ('ALWAYS', 'AUTO', 'OFF'));
