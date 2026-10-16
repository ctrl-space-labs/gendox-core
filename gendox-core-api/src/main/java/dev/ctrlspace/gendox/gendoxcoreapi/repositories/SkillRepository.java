package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.Skill;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SkillRepository extends JpaRepository<Skill, UUID> {

    List<Skill> findAllByLatestTrueAndDeletedFalseOrderByNameAsc();

    Optional<Skill> findByNameAndLatestTrue(String name);

    List<Skill> findAllByNameOrderByVersionDesc(String name);
}
