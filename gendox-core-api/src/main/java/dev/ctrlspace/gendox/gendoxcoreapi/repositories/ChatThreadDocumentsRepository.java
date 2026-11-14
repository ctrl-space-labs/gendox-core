package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.ChatThreadDocument;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ChatThreadMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.Optional;
import java.util.UUID;

public interface ChatThreadDocumentsRepository extends JpaRepository<ChatThreadDocument, UUID> {

    public Optional<ChatThreadDocument> findByProjectIdAndDocumentIdAndThreadId(UUID projectId, UUID documentId, UUID threadId);

    /** True if any of the documents was uploaded to a chat by someone other than the user; by anyone, for no user. */
    @Query("""
            select case when count(ctd) > 0 then true else false end
            from ChatThreadDocument ctd
            where ctd.documentId in :documentIds
              and (:userId is null or ctd.createdBy is null or ctd.createdBy <> :userId)
            """)
    boolean existsUploadedByAnotherUser(Collection<UUID> documentIds, UUID userId);

    @Query(value = """
                SELECT (COUNT(DISTINCT ctd.document_id) = cardinality(CAST(:documentIds AS uuid[]))) AS all_belong
                FROM gendox_core.chat_thread_documents ctd
                WHERE ctd.document_id = ANY(CAST(:documentIds AS uuid[]))
                  AND ctd.project_id  = ANY(CAST(:projectIds  AS uuid[]))
            """, nativeQuery = true)
    boolean areAllDocumentIdsInAnyProject(@Param("documentIds") UUID[] documentIds, @Param("projectIds")  UUID[] projectIds);
}
