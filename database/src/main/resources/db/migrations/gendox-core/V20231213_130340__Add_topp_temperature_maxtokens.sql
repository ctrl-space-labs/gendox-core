
UPDATE gendox_core.project_agent AS pa
SET pa.temperature = 0.8
WHERE pa.temperature IS NULL;

UPDATE gendox_core.project_agent AS pa
SET pa.max_token = 500
WHERE pa.max_token IS NULL;

UPDATE gendox_core.project_agent AS pa
SET pa.top_p = 0.4
WHERE pa.top_p IS NULL;


