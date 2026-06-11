package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.OrganizationConnector;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrganizationConnectorRepository
        extends JpaRepository<OrganizationConnector, UUID>,
                QuerydslPredicateExecutor<OrganizationConnector> {

    List<OrganizationConnector> findAllByOrganizationId(UUID organizationId);

    Optional<OrganizationConnector> findByOrganizationIdAndConnectorType_Name(UUID organizationId, String connectorTypeName);
}
