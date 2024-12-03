package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.ApiKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ApiKeyRepository extends JpaRepository<ApiKey, UUID>, QuerydslPredicateExecutor<ApiKey> {

    List<ApiKey> findAllByOrganizationId(UUID organizationId);

    Optional<ApiKey> findByApiKey(String apiKey);

//    find organizationid by apikey

    @Query("SELECT a.organizationId FROM ApiKey a WHERE a.apiKey = :apiKey")
    Optional<UUID> findOrganizationIdByApiKey(@Param("apiKey") String apiKey);
}
