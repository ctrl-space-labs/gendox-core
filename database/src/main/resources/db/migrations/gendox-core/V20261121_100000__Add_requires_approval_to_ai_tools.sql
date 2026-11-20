-- Ask the user before a tool call runs (APPR-1). For now it applies to tools the page or app runs
-- (execution CLIENT or ACTION): the turn waits for the user's answer, and a declined call runs nothing.
-- Pending calls in gendox_core.completion_turn.pending_calls gain "execution" and "requiresApproval".
ALTER TABLE gendox_core.ai_tools ADD COLUMN IF NOT EXISTS requires_approval boolean NOT NULL DEFAULT false;
