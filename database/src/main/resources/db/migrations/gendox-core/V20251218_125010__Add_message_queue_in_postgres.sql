
create table if not exists gendox_core.queue_messages
(
    id           bigserial primary key,

    -- Stable message id (maps nicely to JMSMessageID / AMQP message-id)
    message_id   uuid        not null default uuid_generate_v4(),
    topic        text        not null,
    payload      jsonb       not null,               -- payload includes {"type": "...", ...}
    headers      jsonb       not null default '{}'::jsonb,
    status       text        not null default 'NEW', -- NEW, IN_PROGRESS, DONE, FAILED, DEAD
    available_at timestamptz not null default now(),
    locked_at    timestamptz,
    locked_by    text,
    attempts     int         not null default 0,
    last_error   text,
    created_at   timestamptz not null default now(),
    updated_at   timestamptz not null default now()
);

-- Ensure message_id is unique (idempotent publish possible)
create unique index if not exists queue_messages_message_id_uq
    on queue_messages (message_id);

-- Status constraint (idempotent add)
do
$$
    begin
        if not exists (select 1
                       from pg_constraint
                       where conname = 'queue_messages_status_chk') then
            alter table queue_messages
                add constraint queue_messages_status_chk
                    check (status in ('NEW', 'IN_PROGRESS', 'DONE', 'FAILED', 'DEAD'));
        end if;
    end
$$;

-- Your original “pull next message” index
create index if not exists queue_messages_topic_status_available_id_idx
    on queue_messages (topic, status, available_at, id);

-- Hot-path partial index: only NEW messages
create index if not exists queue_messages_ready_idx
    on queue_messages (topic, available_at, id)
    where status = 'NEW';

-- Helps recovery scans for stuck IN_PROGRESS messages
create index if not exists queue_messages_in_progress_locked_at_idx
    on queue_messages (locked_at)
    where status = 'IN_PROGRESS';
