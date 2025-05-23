package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.AiTools;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AiToolsRepository extends JpaRepository<AiTools, UUID> {

}
