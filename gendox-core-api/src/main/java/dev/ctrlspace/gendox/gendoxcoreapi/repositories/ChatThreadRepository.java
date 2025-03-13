package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import com.querydsl.core.types.Predicate;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ChatThread;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChatThreadRepository extends JpaRepository<ChatThread, UUID>, QuerydslPredicateExecutor<ChatThread>, ChatThreadRepositoryCustom {

    public boolean existsByIdAndProjectIdIn(UUID id, List<UUID> projectId);

    // is public thread
    public boolean existsByIdAndPublicThreadIsTrue(UUID id);

    @EntityGraph(attributePaths = {"chatThreadMembers"})
    Page<ChatThread> findAll(Predicate predicate, Pageable pageable);

    @EntityGraph(attributePaths = {"chatThreadMembers"})
    List<ChatThread> findByIdIn(List<UUID> threadIds);

    void deleteById(UUID id);
}
