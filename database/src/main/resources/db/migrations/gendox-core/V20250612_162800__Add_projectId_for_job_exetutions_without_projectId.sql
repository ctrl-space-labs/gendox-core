-- Migration to add projectId for job executions without it
INSERT INTO gendox_jobs.batch_job_execution_params
    (job_execution_id, parameter_name, parameter_type, parameter_value, identifying)
SELECT
    be.job_execution_id,
    'projectId',
    'java.lang.String',
    'ALL_PROJECTS',
    'Y'
FROM
    gendox_jobs.batch_job_execution be
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_jobs.batch_job_execution_params p
    WHERE p.job_execution_id = be.job_execution_id
      AND p.parameter_name = 'projectId'
);