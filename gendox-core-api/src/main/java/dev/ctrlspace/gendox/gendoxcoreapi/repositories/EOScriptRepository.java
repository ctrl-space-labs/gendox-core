package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.EOScript;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EOScriptRepository extends JpaRepository<EOScript, UUID>, QuerydslPredicateExecutor<EOScript> {


    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
                UPDATE EOScript e
                SET e.isLatestVersion = false
                WHERE e.task.id = :taskId
            """)
    void markAllAsNotLatest(@Param("taskId") UUID taskId);

    Optional<EOScript> findFirstByTask_IdOrderByCreatedAtDesc(UUID taskId);

    List<EOScript> findByTask_IdOrderByCreatedAtDesc(UUID taskId);

}
