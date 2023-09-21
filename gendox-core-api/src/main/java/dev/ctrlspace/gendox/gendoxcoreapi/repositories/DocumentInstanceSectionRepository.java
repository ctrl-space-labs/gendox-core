package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstanceSection;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Repository
public interface DocumentInstanceSectionRepository extends JpaRepository<DocumentInstanceSection, UUID> , QuerydslPredicateExecutor<DocumentInstanceSection> {

    @Query("SELECT dis FROM DocumentInstanceSection dis WHERE dis.documentInstance.id = :documentInstanceId")
    public List<DocumentInstanceSection> findByDocumentInstance(UUID documentInstanceId);

    @Query("SELECT dis FROM DocumentInstanceSection dis " +
            "INNER JOIN EmbeddingGroup eg ON dis.id = eg.sectionId " + // Adjust the join condition as needed
            "WHERE eg.embeddingId IN :embeddingIds")
    public List<DocumentInstanceSection> findByEmbeddingIds(Set<UUID> embeddingIds);
}
