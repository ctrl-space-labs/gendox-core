-- How a chat agent retrieves project knowledge (#542).
--   ALWAYS: the backend searches before answering, as chat does today; the agent can also call advanced_search.
--   AUTO:   the agent decides when to call advanced_search.
--   OFF:    no retrieval.
-- advanced_search_enable keeps its meaning: rewrite the query with a model before searching.
ALTER TABLE gendox_core.project_agent ADD COLUMN IF NOT EXISTS advanced_search_mode varchar(16) NOT NULL DEFAULT 'ALWAYS'
    CHECK (advanced_search_mode IN ('ALWAYS', 'AUTO', 'OFF'));
