package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.Organization;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.OrganizationProfileProjectAgentDTO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OrganizationRepository extends JpaRepository<Organization, UUID>, QuerydslPredicateExecutor<Organization> {


    @Query(nativeQuery = true, name = "OrganizationProfileDTO.findOrganizationProfileById")
    List<OrganizationProfileProjectAgentDTO> findRawOrganizationProfileById(@Param("orgId") UUID organizationId, @Param("apiKeyStr") String apiKeyStr);

}
