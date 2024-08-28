package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.OrganizationModelProviderKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrganizationModelProviderKeysRepository extends JpaRepository<OrganizationModelProviderKey, UUID>, QuerydslPredicateExecutor<OrganizationModelProviderKey> {

    Optional<OrganizationModelProviderKey> findByIdAndOrganizationId(UUID id, UUID organizationId);

}
