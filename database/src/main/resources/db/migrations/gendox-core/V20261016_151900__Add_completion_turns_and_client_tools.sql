ALTER TABLE gendox_core.ai_tools ADD COLUMN execution varchar(16) NOT NULL DEFAULT 'ACTION'
    CHECK (execution IN ('ACTION', 'CLIENT'));

CREATE TABLE gendox_core.completion_turn (
    id uuid PRIMARY KEY,
    thread_id uuid NOT NULL REFERENCES gendox_core.chat_thread(id),
    project_id uuid NOT NULL REFERENCES gendox_core.projects(id),
    user_message_id uuid NOT NULL REFERENCES gendox_core.message(id),
    actor_id uuid,
    session_hash varchar(64) NOT NULL,
    status varchar(32) NOT NULL CHECK (status IN ('GENERATING','WAITING_FOR_TOOLS','COMPLETED','FAILED')),
    history_message_ids jsonb NOT NULL DEFAULT '[]',
    message_ids jsonb NOT NULL DEFAULT '[]',
    pending_calls jsonb NOT NULL DEFAULT '[]',
    iteration integer NOT NULL DEFAULT 0,
    client_tool_results boolean NOT NULL DEFAULT false,
    configuration_hash varchar(64) NOT NULL,
    owner_id uuid,
    deadline timestamptz,
    heartbeat timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now(),
    error varchar(255)
);
CREATE UNIQUE INDEX completion_turn_one_active ON gendox_core.completion_turn(thread_id)
    WHERE status IN ('GENERATING','WAITING_FOR_TOOLS');
CREATE INDEX completion_turn_thread_created ON gendox_core.completion_turn(thread_id, created_at DESC);
CREATE INDEX completion_turn_waiting ON gendox_core.completion_turn(deadline) WHERE status = 'WAITING_FOR_TOOLS';
