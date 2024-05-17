-- create chat_thread table if not exists
CREATE TABLE IF NOT EXISTS gendox_core.chat_thread
(
    id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name       VARCHAR(255) NOT NULL,
    project_id uuid,
    created_at timestamp,
    updated_at timestamp,
    created_by uuid,
    updated_by uuid,
    FOREIGN KEY (project_id) REFERENCES gendox_core.projects (id)
);

-- create chat_thread_member table if not exists
CREATE TABLE IF NOT EXISTS gendox_core.chat_thread_member
(
    id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id  uuid,
    user_id    uuid,
    created_at timestamp,
    updated_at timestamp,
    created_by uuid,
    updated_by uuid,
    FOREIGN KEY (thread_id) REFERENCES gendox_core.chat_thread (id),
    FOREIGN KEY (user_id) REFERENCES gendox_core.users (id)
);

-- migration, create chat_thread from existing gendox_core.message
INSERT INTO gendox_core.chat_thread (id, name, project_id, created_at, updated_at, created_by, updated_by)
SELECT DISTINCT ON (m.thread_id) m.thread_id, 'New Chat', m.project_id, m.created_at, m.updated_at, m.created_by, m.updated_by
FROM gendox_core.message m
    left join gendox_core.chat_thread ct on ct.id = m.thread_id
where ct.id is null
order by thread_id, created_at;

-- migration, create chat_thread_member from existing gendox_core.message.
-- 2 members per thread, the 1st is the created_by
INSERT INTO gendox_core.chat_thread_member (thread_id, user_id, created_at, updated_at, created_by, updated_by)
SELECT DISTINCT ON (m.thread_id)  m.thread_id, m.created_by, m.created_at, m.updated_at, m.created_by, m.updated_by
FROM gendox_core.message m
    left join gendox_core.chat_thread_member ctm
        on ctm.thread_id = m.thread_id
               and ctm.user_id = m.created_by
where ctm.id is null
order by thread_id, created_at;

-- migration, create chat_thread_member from existing gendox_core.message.
-- 2 members per thread, the 2nd is the agent connected with the project_id
INSERT INTO gendox_core.chat_thread_member (thread_id, user_id, created_at, updated_at, created_by, updated_by)
SELECT DISTINCT ON (m.thread_id)  m.thread_id, pa.user_id, m.created_at, m.updated_at, m.created_by, m.updated_by
FROM gendox_core.message m
    inner join gendox_core.project_agent pa on pa.project_id = m.project_id
    left join gendox_core.chat_thread_member ctm
        on ctm.thread_id = m.thread_id
               and ctm.user_id = pa.user_id
where ctm.id is null
order by thread_id, created_at;

DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1
            FROM information_schema.table_constraints
            WHERE constraint_type = 'FOREIGN KEY'
              AND table_name = 'message'
              AND table_schema = 'gendox_core'
              AND constraint_name = 'message_thread_id_fkey'
        ) THEN
            ALTER TABLE gendox_core.message
                ADD CONSTRAINT message_thread_id_fkey
                    FOREIGN KEY (thread_id) REFERENCES gendox_core.chat_thread(id);
        END IF;
    END
$$;



