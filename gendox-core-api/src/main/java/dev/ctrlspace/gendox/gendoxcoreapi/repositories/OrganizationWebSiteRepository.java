package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.OrganizationWebSite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.stereotype.Repository;
import org.springframework.data.repository.query.Param;


import java.util.List;
import java.util.UUID;
import java.util.Optional;


@Repository
public interface OrganizationWebSiteRepository extends JpaRepository<OrganizationWebSite, UUID>, QuerydslPredicateExecutor<OrganizationWebSite> {

    List<OrganizationWebSite> findAllByOrganizationId(UUID organizationId);


    @Query(nativeQuery = true, value = """
                SELECT ows.*
                FROM gendox_core.organization_web_sites ows
                INNER JOIN gendox_core.integrations i ON ows.integration_id = i.id
                INNER JOIN gendox_core.api_keys ak ON ak.api_key = :apiKey
                WHERE ows.organization_id = :organizationId
                  AND ows.url = :domain
                  AND ak.organization_id = :organizationId
                  AND i.type_id IN (
                      SELECT id
                      FROM gendox_core.integration_types
                      WHERE name = :integrationTypeName
                  )
                LIMIT 1
            """)
    Optional<OrganizationWebSite> findMatchingOrganizationWebSite(
            @Param("organizationId") UUID organizationId,
            @Param("domain") String domain,
            @Param("apiKey") String apiKey,
            @Param("integrationTypeName") String integrationTypeName
    );

}
