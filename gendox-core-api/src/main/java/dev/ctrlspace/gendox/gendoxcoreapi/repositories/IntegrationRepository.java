package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.Integration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface IntegrationRepository extends JpaRepository<Integration, UUID>, QuerydslPredicateExecutor<Integration> {

    @Query("SELECT i FROM Integration i WHERE i.isActive = true AND i.integrationType.id = :typeId")
    List<Integration> findActiveIntegrationsByType(Long typeId);

    @Query("SELECT i FROM Integration i WHERE i.isActive = true")
    List<Integration> findActiveIntegrations();
}
