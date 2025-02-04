package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.EmbeddingGroup;
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
public interface EmbeddingGroupRepository extends JpaRepository<EmbeddingGroup, UUID>, QuerydslPredicateExecutor<EmbeddingGroup> {

    @Query("SELECT eg.sectionId FROM EmbeddingGroup eg WHERE eg.embeddingId = :embeddingId")
    UUID findSectionIdByEmbeddingId(@Param("embeddingId") UUID embeddingId);

    EmbeddingGroup findByEmbeddingId(@Param("embeddingId") UUID embeddingId);

    @Query("SELECT eg " +
            "FROM EmbeddingGroup eg " +
            "WHERE (eg.sectionId is not null and eg.sectionId = :sectionId) " +
            "   OR (eg.messageId is not null and eg.messageId = :messageId)")
    Optional<EmbeddingGroup> findBySectionIdOrMessageId(@Param("sectionId") UUID sectionId, @Param("messageId") UUID messageId);


    List<EmbeddingGroup> findBySectionId(UUID sectionId);

    @Query("SELECT eg " +
            "FROM EmbeddingGroup eg " +
            "WHERE (eg.sectionId is not null and eg.sectionId = :sectionId) " +
            "   OR (eg.messageId is not null and eg.messageId = :messageId) " +
            "AND eg.semanticSearchModelId = :semanticSearchModelId")
    Optional<EmbeddingGroup> findBySectionIdOrMessageIdAndSemanticSearchModel(
            @Param("sectionId") UUID sectionId,
            @Param("messageId") UUID messageId,
            @Param("semanticSearchModelId") UUID semanticSearchModelId);

    @Query("SELECT eg FROM EmbeddingGroup eg WHERE eg.sectionId IN :sectionIds")
    List<EmbeddingGroup> findAllBySectionIdIn(@Param("sectionIds") List<UUID> sectionIds);

    @Modifying
    @Query("DELETE FROM EmbeddingGroup eg WHERE eg.sectionId IN :sectionIds")
    void bulkDeleteBySectionIds(@Param("sectionIds") List<UUID> sectionIds);


}
