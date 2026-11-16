package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.ApiKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;


import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ApiKeyRepository extends JpaRepository<ApiKey, UUID>, QuerydslPredicateExecutor<ApiKey> {

    List<ApiKey> findAllByOrganizationId(UUID organizationId);

    // the key column is encrypted, so a presented key is found by its hash: ApiKey.hashOf(key)
    Optional<ApiKey> findByApiKeyHash(String apiKeyHash);

    @Query("SELECT a FROM ApiKey a WHERE a.id IN (SELECT o.apiKeyId FROM OrganizationWebSite o WHERE o.integrationId = :integrationId)")
    Optional<ApiKey> findByIntegrationId(@Param("integrationId") UUID integrationId);

//    find organizationid by apikey

    @Query("SELECT a.organizationId FROM ApiKey a WHERE a.apiKeyHash = :apiKeyHash")
    Optional<UUID> findOrganizationIdByApiKeyHash(@Param("apiKeyHash") String apiKeyHash);
}
