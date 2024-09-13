package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.OrganizationDid;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrganizationDidRepository extends JpaRepository<OrganizationDid, UUID>, QuerydslPredicateExecutor<OrganizationDid> {

    Optional<OrganizationDid> findByOrganizationId(UUID organizationId);


}
