-- Create the eo_task_geometries table to store geometries associated with EO tasks
CREATE TABLE IF NOT EXISTS gendox_core.eo_task_geometries (
    id            UUID         NOT NULL,
    task_id       UUID         NOT NULL,
    geometry_type_id bigint NOT NULL,
    coordinates   JSONB        NOT NULL,  -- raw GeoJSON coordinates array
    display_order INT          NOT NULL DEFAULT 0,
    is_enabled BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP,
    updated_at    TIMESTAMP,
    created_by    UUID,
    updated_by    UUID,
    PRIMARY KEY (id),
    FOREIGN KEY (task_id) REFERENCES gendox_core.tasks(id),
    FOREIGN KEY (geometry_type_id) REFERENCES gendox_core.types(id)
);

CREATE INDEX IF NOT EXISTS idx_eo_task_geometries_task_id
    ON gendox_core.eo_task_geometries(task_id);



-- GEOMETRIES RELATIONSHIP TYPES
INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'GEOMETRY_TYPE', 'POINT', 'A single point geometry'
WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.types WHERE type_category = 'GEOMETRY_TYPE' AND name = 'POINT'
);

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'GEOMETRY_TYPE', 'LINEAR_RING', 'A linestring geometry'
WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.types WHERE type_category = 'GEOMETRY_TYPE' AND name = 'LINEAR_RING'
);

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'GEOMETRY_TYPE', 'POLYGON', 'A polygon geometry'
WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.types WHERE type_category = 'GEOMETRY_TYPE' AND name = 'POLYGON'
);
