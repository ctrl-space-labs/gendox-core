package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.Organization;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.OrganizationProfileDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.UserOrganizationProjectAgentDTO;
import jakarta.persistence.NamedNativeQuery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrganizationRepository extends JpaRepository<Organization, UUID>, QuerydslPredicateExecutor<Organization> {


    @Query(nativeQuery = true, name = "OrganizationProfileDTO.findOrganizationProfileById")
    OrganizationProfileDTO findRawOrganizationProfileById(@Param("orgId") UUID organizationId, @Param("roleType") String roleType);

}
