UPDATE gendox_core.project_agent
SET temperature = 0.8
WHERE temperature IS NULL;

UPDATE gendox_core.project_agent
SET max_token = 500
WHERE max_token IS NULL;

UPDATE gendox_core.project_agent
SET top_p = 0.4
WHERE top_p IS NULL;
