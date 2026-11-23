package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModelProvider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;

import java.util.Optional;
import java.util.UUID;

public interface AiModelProviderRepository extends JpaRepository<AiModelProvider, UUID>, QuerydslPredicateExecutor<AiModelProvider> {

    Optional<AiModelProvider> findByName(String name);
}
