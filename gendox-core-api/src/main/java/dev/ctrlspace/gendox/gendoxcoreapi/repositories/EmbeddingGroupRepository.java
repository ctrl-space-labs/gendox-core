package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.EmbeddingGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface EmbeddingGroupRepository extends JpaRepository<EmbeddingGroup, UUID>, QuerydslPredicateExecutor<EmbeddingGroup> {

    @Query("SELECT eg.sectionId FROM EmbeddingGroup eg WHERE eg.embeddingId = :embeddingId")
    UUID findSectionIdByEmbeddingId(@Param("embeddingId") UUID embeddingId);


    @Query("SELECT eg FROM EmbeddingGroup eg WHERE eg.embeddingId = :embeddingId")
    EmbeddingGroup findEmbeddingGroupByEmbeddingId(@Param("embeddingId") UUID embeddingId);

}
