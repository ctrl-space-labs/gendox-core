

-- add idempotent column to mark a chat thread as public
ALTER TABLE gendox_core.chat_thread
    ADD COLUMN if not exists public_thread BOOLEAN DEFAULT FALSE NOT NULL;

