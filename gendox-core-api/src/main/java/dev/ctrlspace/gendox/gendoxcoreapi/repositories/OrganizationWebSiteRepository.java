package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.OrganizationWebSite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OrganizationWebSiteRepository extends JpaRepository<OrganizationWebSite, UUID>, QuerydslPredicateExecutor<OrganizationWebSite> {

    List<OrganizationWebSite> findAllByOrganizationId(UUID organizationId);
}
