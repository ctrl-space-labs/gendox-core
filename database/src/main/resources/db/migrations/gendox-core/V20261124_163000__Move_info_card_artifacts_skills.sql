-- Info card becomes a section of the artifacts skill (gendox-core#570). Every agent that has the Info card skill
-- from the library gets the artifacts skill, unless it has it already, and loses Info card; Info card leaves the
-- library. Safe to run again: each statement finds nothing left to do the second time.

-- 1. the artifacts skill for every agent with Info card that lacks it, copied from the library's latest version
INSERT INTO gendox_core.agent_skills (agent_id, skill_id, name, description, content, created_at, updated_at)
SELECT info_card.agent_id, artifacts.id, artifacts.name, artifacts.description, artifacts.content, now(), now()
FROM gendox_core.agent_skills info_card
         JOIN gendox_core.skills artifacts
              ON artifacts.name = 'artifacts' AND artifacts.latest AND NOT artifacts.deleted
WHERE info_card.skill_id IN (SELECT id FROM gendox_core.skills WHERE name = 'info-card')
    ON CONFLICT (agent_id, name) DO NOTHING;

-- 2. Info card off every agent; only the copies of the library's, not an agent's own skill of the same name
DELETE
FROM gendox_core.agent_skills
WHERE skill_id IN (SELECT id FROM gendox_core.skills WHERE name = 'info-card');

-- 3. Info card out of the library; its versions stay, as every deleted skill's do
UPDATE gendox_core.skills
SET deleted    = TRUE,
    updated_at = now()
WHERE name = 'info-card'
  AND NOT deleted;