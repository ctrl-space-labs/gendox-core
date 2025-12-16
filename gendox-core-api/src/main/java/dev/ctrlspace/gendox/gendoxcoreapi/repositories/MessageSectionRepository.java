package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.MessageSection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;

import java.util.List;
import java.util.UUID;

@Repository
public interface MessageSectionRepository extends JpaRepository<MessageSection, UUID>, QuerydslPredicateExecutor<MessageSection> {

    void deleteAllBySectionId(UUID sectionId);

    List<MessageSection> findAllBySectionId(UUID sectionId);

    @Modifying
    @Query("DELETE FROM MessageSection ms WHERE ms.sectionId IN :sectionIds")
    void bulkDeleteBySectionIds(@Param("sectionIds") List<UUID> sectionIds);

    @Modifying
    @Query(nativeQuery = true,
            value = "DELETE FROM gendox_core.message_section ms " +
                    "WHERE ms.document_id = :documentId")
    void deleteByDocumentId(UUID documentId);

}
