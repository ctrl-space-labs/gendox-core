package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentSectionMetadata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DocumentSectionMetadataRepository extends JpaRepository<DocumentSectionMetadata, UUID>, QuerydslPredicateExecutor<DocumentSectionMetadata> {

    @Modifying
    @Query("DELETE FROM DocumentSectionMetadata m WHERE m.id IN :metadataIds")
    void bulkDeleteByIds(@Param("metadataIds") List<UUID> metadataIds);


}
