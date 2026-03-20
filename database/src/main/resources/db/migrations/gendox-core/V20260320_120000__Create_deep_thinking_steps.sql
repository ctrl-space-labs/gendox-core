CREATE TABLE IF NOT EXISTS gendox_core.deep_thinking_steps (
    id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    job_execution_id BIGINT NOT NULL,
    thread_id        UUID NOT NULL,
    step_order       INTEGER NOT NULL,
    step_type        VARCHAR(50) NOT NULL,
    summary          TEXT,
    message_id       UUID,
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deep_thinking_steps_job ON gendox_core.deep_thinking_steps(job_execution_id);
