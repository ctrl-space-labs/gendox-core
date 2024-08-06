package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModelProvider;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AiModelProviderRepository extends JpaRepository<AiModelProvider, UUID> {

    Optional<AiModelProvider> findByName(String name);
}
