package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.WalletKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface WalletKeyRepository extends JpaRepository<WalletKey, UUID>, QuerydslPredicateExecutor<WalletKey> {


Optional<WalletKey> findByOrganizationId(UUID organizationId);

}
