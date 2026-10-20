-- Where a custom tool runs (#518):
--   ACTION: the page or app acts on the call; the agent is told it was executed (how every custom tool works today).
--   CLIENT: the page or app runs it and sends the result back; the agent waits for it.
ALTER TABLE gendox_core.ai_tools ADD COLUMN execution varchar(16) NOT NULL DEFAULT 'ACTION'
    CHECK (execution IN ('ACTION', 'CLIENT'));

-- A chat turn that stopped to wait for the results of CLIENT tool calls. Only a waiting turn gets a
-- row; the messages themselves stay in gendox_core.message.
CREATE TABLE gendox_core.completion_turn (
    id                   uuid PRIMARY KEY,
    thread_id            uuid        NOT NULL REFERENCES gendox_core.chat_thread(id),
    project_id           uuid        NOT NULL REFERENCES gendox_core.projects(id),
    user_message_id      uuid        NOT NULL REFERENCES gendox_core.message(id),
    assistant_message_id uuid        NOT NULL REFERENCES gendox_core.message(id),
    actor_id             uuid,                -- the signed-in user who sent the message
    session_hash         varchar(64),         -- SHA-256 of the resume token of an anonymous session
    status               varchar(32) NOT NULL CHECK (status IN ('WAITING_FOR_TOOLS', 'RESUMED', 'CANCELLED')),
    pending_calls        jsonb       NOT NULL, -- [{id, messageId, name, arguments}]
    iteration            integer     NOT NULL, -- model calls the turn has made so far
    deadline             timestamptz NOT NULL,
    created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX completion_turn_one_waiting ON gendox_core.completion_turn(thread_id)
    WHERE status = 'WAITING_FOR_TOOLS';
CREATE INDEX completion_turn_waiting_deadline ON gendox_core.completion_turn(deadline)
    WHERE status = 'WAITING_FOR_TOOLS';
