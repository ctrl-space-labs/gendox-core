-- Artifacts in the answer, and one skill for them (gendox-core#570). Safe to run again: each statement finds nothing
-- left to do the second time.

-- How an artifact shows in the answer: as a card (the default), or inline, as part of the answer

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'ARTIFACT_DISPLAY', 'CARD', 'Shown as a card in the answer, opened in a panel'
    WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.types
    WHERE type_category = 'ARTIFACT_DISPLAY' AND name = 'CARD'
);

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'ARTIFACT_DISPLAY', 'INLINE', 'Shown as part of the answer, with no card around it'
    WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.types
    WHERE type_category = 'ARTIFACT_DISPLAY' AND name = 'INLINE'
);

ALTER TABLE gendox_core.artifacts
    ADD COLUMN IF NOT EXISTS display_id BIGINT REFERENCES gendox_core.types (id);

COMMENT ON COLUMN gendox_core.artifacts.display_id
    IS 'How it shows in the answer, an ARTIFACT_DISPLAY type; null is a card, as every artifact made before it showed';

-- Info card becomes a section of the artifacts skill. Every agent that has the Info card skill from the library gets
-- the artifacts skill, unless it has it already, and loses Info card; Info card leaves the library.

-- the artifacts skill for every agent with Info card that lacks it, copied from the library's latest version
INSERT INTO gendox_core.agent_skills (agent_id, skill_id, name, description, content, created_at, updated_at)
SELECT info_card.agent_id, artifacts.id, artifacts.name, artifacts.description, artifacts.content, now(), now()
FROM gendox_core.agent_skills info_card
         JOIN gendox_core.skills artifacts
              ON artifacts.name = 'artifacts' AND artifacts.latest AND NOT artifacts.deleted
WHERE info_card.skill_id IN (SELECT id FROM gendox_core.skills WHERE name = 'info-card')
    ON CONFLICT (agent_id, name) DO NOTHING;

-- Info card off every agent; only the copies of the library's, not an agent's own skill of the same name
DELETE
FROM gendox_core.agent_skills
WHERE skill_id IN (SELECT id FROM gendox_core.skills WHERE name = 'info-card');

-- Info card out of the library; its versions stay, as every deleted skill's do
UPDATE gendox_core.skills
SET deleted    = TRUE,
    updated_at = now()
WHERE name = 'info-card'
  AND NOT deleted;