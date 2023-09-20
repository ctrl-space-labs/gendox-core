package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectDocument;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProjectDocumentRepository extends JpaRepository<ProjectDocument, UUID>, QuerydslPredicateExecutor<ProjectDocument> {


    public List<ProjectDocument> findByProjectId(UUID projectId);

    // Custom query to retrieve a list of documentIds based on projectId
    @Query("SELECT pd.documentId FROM ProjectDocument pd WHERE pd.project.id = :projectId")
    List<UUID> findDocumentIdsByProjectId(UUID projectId);

    // Custom query to retrieve a list of DocumentInstance entities based on documentIds
    @Query("SELECT di FROM DocumentInstance di WHERE di.id IN :documentIds")
    List<DocumentInstance> findDocumentInstancesByDocumentIds(List<UUID> documentIds);

}
