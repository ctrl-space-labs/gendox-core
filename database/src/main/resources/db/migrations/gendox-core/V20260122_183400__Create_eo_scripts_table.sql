CREATE TABLE IF NOT EXISTS gendox_core.eo_scripts (
    id UUID NOT NULL,
    task_id UUID NOT NULL,
    title VARCHAR(255),
    description VARCHAR(255),
    script_content TEXT,
    is_latest_version BOOLEAN NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    PRIMARY KEY (id),
    FOREIGN KEY (task_id) REFERENCES gendox_core.tasks(id)
);

CREATE INDEX IF NOT EXISTS idx_eo_scripts_task_id ON gendox_core.eo_scripts(task_id);

-- Ensure that only one latest version of the script exists per task
CREATE UNIQUE INDEX IF NOT EXISTS unique_latest_script_per_task
ON gendox_core.eo_scripts (task_id)
WHERE is_latest_version = true;


INSERT into gendox_core.types
(type_category, name, description)
select 'TASK_TYPE', 'EARTH_OBSERVATION', 'Task related to processing and analyzing earth observation data'
where not exists(SELECT *
                 FROM gendox_core.types
                 where type_category = 'TASK_TYPE'
                   and name = 'EARTH_OBSERVATION');