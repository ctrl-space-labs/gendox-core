package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstanceSection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Repository
public interface DocumentInstanceRepository extends JpaRepository<DocumentInstance, UUID> , QuerydslPredicateExecutor<DocumentInstance>, DocumentInstanceExtendedRepository {

    @Query(nativeQuery = true, value = "SELECT di.remote_url FROM gendox_core.document_instance di " +
            "INNER JOIN gendox_core.document_instance_sections dis on di.id = dis.document_instance_id " +
            "WHERE dis.id = :sectionId")
    String findRemoteUrlBySectionId(@Param("sectionId") UUID sectionId);



}
