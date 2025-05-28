-- TASK TYPES
INSERT into gendox_core.types
(type_category, name, description)
select 'TASK_TYPE', 'DEEP_RESEARCH', 'Deep Research'
where not exists(SELECT *
                 FROM gendox_core.types
                 where type_category = 'TASK_TYPE'
                   and name = 'DEEP_RESEARCH');

INSERT into gendox_core.types
(type_category, name, description)
select 'TASK_TYPE', 'DOCUMENT_INSIGHTS', 'Document QA'
where not exists(SELECT *
                 FROM gendox_core.types
                 where type_category = 'TASK_TYPE'
                   and name = 'DOCUMENT_INSIGHTS');

INSERT into gendox_core.types
(type_category, name, description)
select 'TASK_TYPE', 'DOCUMENT_DIGITIZATION', 'LLM OCR'
where not exists(SELECT *
                 FROM gendox_core.types
                 where type_category = 'TASK_TYPE'
                   and name = 'DOCUMENT_DIGITIZATION');
-- NODE TYPES
INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'TASK_NODE_TYPE', 'DOCUMENT', 'This node represents a document'
WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.types WHERE type_category = 'TASK_NODE_TYPE' AND name = 'DOCUMENT'
);

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'TASK_NODE_TYPE', 'QUESTION', 'This node represents a question'
WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.types WHERE type_category = 'TASK_NODE_TYPE' AND name = 'QUESTION'
);

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'TASK_NODE_TYPE', 'PROMPT', 'This node represents a prompt'
WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.types WHERE type_category = 'TASK_NODE_TYPE' AND name = 'PROMPT'
);

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'TASK_NODE_TYPE', 'STRUCTURE', 'This node represents a structure'
WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.types WHERE type_category = 'TASK_NODE_TYPE' AND name = 'STRUCTURE'
);

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'TASK_NODE_TYPE', 'NOTE', 'This node represents a note'
WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.types WHERE type_category = 'TASK_NODE_TYPE' AND name = 'NOTE'
);

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'TASK_NODE_TYPE', 'ANSWER', 'This node represents an answer'
WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.types WHERE type_category = 'TASK_NODE_TYPE' AND name = 'ANSWER'
);

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'TASK_NODE_TYPE', 'PAGE', 'This node represents a page'
WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.types WHERE type_category = 'TASK_NODE_TYPE' AND name = 'PAGE'
);

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'TASK_NODE_TYPE', 'TASK_FINAL_ANSWER', 'This node represents a final answer to a task'
WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.types WHERE type_category = 'TASK_NODE_TYPE' AND name = 'TASK_FINAL_ANSWER'
);

-- NODE RELATIONSHIP TYPES

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'TASK_NODE_RELATIONSHIP_TYPE', 'CONTAINS', 'Relation between two nodes where the first node contains the second node'
WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.types WHERE type_category = 'TASK_NODE_RELATIONSHIP_TYPE' AND name = 'CONTAINS'
);

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'TASK_NODE_RELATIONSHIP_TYPE', 'HAS_PROMPT', 'Relation between two nodes where the second node is a prompt for the first node'
WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.types WHERE type_category = 'TASK_NODE_RELATIONSHIP_TYPE' AND name = 'HAS_PROMPT'
);

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'TASK_NODE_RELATIONSHIP_TYPE', 'HAS_STRUCTURE', 'Relation between two nodes where the second node is a structure for the first node'
WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.types WHERE type_category = 'TASK_NODE_RELATIONSHIP_TYPE' AND name = 'HAS_STRUCTURE'
);

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'TASK_NODE_RELATIONSHIP_TYPE', 'ANSWERS', 'Relation between two nodes where the second node is an answer to the first node'
WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.types WHERE type_category = 'TASK_NODE_RELATIONSHIP_TYPE' AND name = 'ANSWERS'
);

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'TASK_NODE_RELATIONSHIP_TYPE', 'NOTES_ON', 'Relation between two nodes where the second node is a note on the first node'
WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.types WHERE type_category = 'TASK_NODE_RELATIONSHIP_TYPE' AND name = 'NOTES_ON'
);


INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'TASK_NODE_RELATIONSHIP_TYPE', 'FOLLOWS', 'Relation between two nodes where the second node follows the first node'
WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.types WHERE type_category = 'TASK_NODE_RELATIONSHIP_TYPE' AND name = 'FOLLOWS'
);

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'TASK_NODE_RELATIONSHIP_TYPE', 'REFINES', 'Relation between two nodes where the second node refines the first node'
WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.types WHERE type_category = 'TASK_NODE_RELATIONSHIP_TYPE' AND name = 'REFINES'
);

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'TASK_NODE_RELATIONSHIP_TYPE', 'RELATED_TO', 'Relation between two nodes where the second node is related to the first node'
WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.types WHERE type_category = 'TASK_NODE_RELATIONSHIP_TYPE' AND name = 'RELATED_TO'
);


-- Create new tables
CREATE TABLE IF NOT EXISTS gendox_core.tasks (
    id uuid DEFAULT uuid_generate_v4(),
    project_id uuid not null,
    task_type_id bigint NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, COMPLETED, FAILED
    title TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id),
    FOREIGN KEY (project_id) REFERENCES gendox_core.projects(id),
    FOREIGN KEY (task_type_id) REFERENCES gendox_core.types(id)
);

CREATE INDEX IF NOT EXISTS idx_tasks_project ON gendox_core.tasks(project_id);

CREATE TABLE IF NOT EXISTS gendox_core.task_nodes (
  id uuid DEFAULT uuid_generate_v4(),
  task_id uuid NOT NULL,
  node_type_id bigint NOT NULL, -- DOCUMENT, QUESTION, PAGE, PROMPT, NOTE
  content_text TEXT,
  parent_node_id uuid,
  document_id uuid, -- only when node_type='DOCUMENT'
  page_number INTEGER, -- used only in DOCUMENT_DIGITIZATION tasks
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  created_by uuid,
  updated_by uuid,
  PRIMARY KEY (id),
  FOREIGN KEY (task_id) REFERENCES gendox_core.tasks(id),
  FOREIGN KEY (node_type_id) REFERENCES gendox_core.types(id),
  FOREIGN KEY (parent_node_id) REFERENCES gendox_core.task_nodes(id)
);

CREATE INDEX IF NOT EXISTS idx_nodes_task       ON gendox_core.task_nodes(task_id);
CREATE INDEX IF NOT EXISTS idx_nodes_parent     ON gendox_core.task_nodes(parent_node_id);



CREATE TABLE IF NOT EXISTS gendox_core.task_edges (
  id uuid DEFAULT uuid_generate_v4(),
  from_node_id uuid NOT NULL,
  to_node_id uuid NOT NULL,
  relation_type_id bigint NOT NULL, -- 'contains', 'answers', 'follows'
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  created_by uuid,
  updated_by uuid,
  PRIMARY KEY (id),
  FOREIGN KEY (from_node_id) REFERENCES gendox_core.task_nodes(id),
  FOREIGN KEY (to_node_id) REFERENCES gendox_core.task_nodes(id),
  FOREIGN KEY (relation_type_id) REFERENCES gendox_core.types(id)
);

CREATE INDEX IF NOT EXISTS idx_edges_from   ON gendox_core.task_edges(from_node_id);
CREATE INDEX IF NOT EXISTS idx_edges_to     ON gendox_core.task_edges(to_node_id);
