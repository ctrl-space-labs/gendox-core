-- Widgets are not artifacts (gendox-core#570): a widget is part of the answer and is not stored as an artifact, and an
-- artifact always opens beside the conversation. How an artifact shows is no longer a choice, so its display goes.
-- Safe to run again: each statement finds nothing left to do the second time.

ALTER TABLE gendox_core.artifacts
DROP COLUMN IF EXISTS display_id;

DELETE
FROM gendox_core.types
WHERE type_category = 'ARTIFACT_DISPLAY';