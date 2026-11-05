-- Every request on a chat thread checks that the user is one of its members.
CREATE INDEX IF NOT EXISTS idx_chat_thread_member_thread_user
    ON gendox_core.chat_thread_member (thread_id, user_id);
