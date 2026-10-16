package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.AgentSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AgentSkillRepository extends JpaRepository<AgentSkill, UUID> {

    List<AgentSkill> findAllByAgentIdOrderByNameAsc(UUID agentId);

    Optional<AgentSkill> findByAgentIdAndName(UUID agentId, String name);

    /**
     * Moves every agent that holds a copy of one of {@code fromSkillIds} (the versions of one system
     * skill) to the new version. Agents that removed the skill have no row, so they stay without it.
     */
    @Modifying
    @Query("""
            UPDATE AgentSkill a
               SET a.skillId = :toSkillId, a.name = :name, a.description = :description, a.content = :content
             WHERE a.skillId IN :fromSkillIds
            """)
    int moveCopiesToVersion(@Param("fromSkillIds") Collection<UUID> fromSkillIds,
                            @Param("toSkillId") UUID toSkillId,
                            @Param("name") String name,
                            @Param("description") String description,
                            @Param("content") String content);
}
