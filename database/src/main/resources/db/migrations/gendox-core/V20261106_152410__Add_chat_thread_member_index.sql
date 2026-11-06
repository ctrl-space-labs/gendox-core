-- Every request on a chat thread checks that the user is one of its members.
CREATE INDEX IF NOT EXISTS idx_chat_thread_member_thread_user
    ON gendox_core.chat_thread_member (thread_id, user_id);

-- Opening a chat, the message history of every completion and the thread list read messages by thread, by date.
CREATE INDEX IF NOT EXISTS idx_message_thread_created
    ON gendox_core.message (thread_id, created_at);

-- Document access checks, document lists by project and attachment checks read documents by project.
CREATE INDEX IF NOT EXISTS idx_project_documents_project_document
    ON gendox_core.project_documents (project_id, document_id);
