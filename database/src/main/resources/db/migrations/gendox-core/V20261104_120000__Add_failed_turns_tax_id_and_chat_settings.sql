-- ---------------------------------------------------------------------------
-- 1. Failed chat turns
--
-- A chat turn that fails is saved as FAILED, so completion-status reports it at once instead of
-- showing GENERATING until the 5 minute window passes. A turn can fail before the model wrote any
-- message, so a failed turn may have no assistant message.
-- ---------------------------------------------------------------------------
ALTER TABLE gendox_core.completion_turn ALTER COLUMN assistant_message_id DROP NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1
                   FROM pg_constraint
                   WHERE conrelid = 'gendox_core.completion_turn'::regclass
                     AND conname = 'completion_turn_status_check'
                     AND pg_get_constraintdef(oid) LIKE '%FAILED%') THEN
        ALTER TABLE gendox_core.completion_turn DROP CONSTRAINT IF EXISTS completion_turn_status_check;
        ALTER TABLE gendox_core.completion_turn ADD CONSTRAINT completion_turn_status_check
            CHECK (status IN ('WAITING_FOR_TOOLS', 'RESUMED', 'CANCELLED', 'FAILED'));
    END IF;
END $$;


-- ---------------------------------------------------------------------------
-- 2. Organization tax ID (VAT or company registration number), shown in the invoice details
-- ---------------------------------------------------------------------------
ALTER TABLE gendox_core.organizations ADD COLUMN IF NOT EXISTS tax_id varchar(64);


-- ---------------------------------------------------------------------------
-- 3. How an agent's chat looks to the people who use it (#527), edited under Deploy
--
-- chat_settings: {welcomeMessage, suggestedQuestions[], theme, accentColor, backgroundColor,
--                 bubbleText, disclaimer, branding}, shown by the website widget, the agent home and Try it.
-- branding is the "Powered by Gendox" line: STANDARD, SMALL or NONE. NONE is a plan entitlement only Gendox sets.
-- ---------------------------------------------------------------------------
ALTER TABLE gendox_core.project_agent ADD COLUMN IF NOT EXISTS chat_settings jsonb;


-- ---------------------------------------------------------------------------
-- 4. Automatic chat thread names (#549)
--
-- The tokens of the call that names a new thread. Its own type, so it is not counted as a message
-- (organization_daily_usage counts COMPLETION_RESPONSE rows as messages).
-- ---------------------------------------------------------------------------
INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'AUDIT_LOG_TYPE', 'CHAT_THREAD_NAMING', 'Tokens used to name a new chat thread from its first question'
WHERE NOT EXISTS (SELECT 1 FROM gendox_core.types
                  WHERE type_category = 'AUDIT_LOG_TYPE' AND name = 'CHAT_THREAD_NAMING');


-- ---------------------------------------------------------------------------
-- 5. Answer feedback: 👍 (1) or 👎 (-1) and an optional comment, set by whoever asked
-- ---------------------------------------------------------------------------
ALTER TABLE gendox_core.message ADD COLUMN IF NOT EXISTS feedback integer CHECK (feedback IN (-1, 1));
ALTER TABLE gendox_core.message ADD COLUMN IF NOT EXISTS feedback_comment text;
