package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.DeepThinkingStep;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DeepThinkingStepRepository extends JpaRepository<DeepThinkingStep, UUID> {

    List<DeepThinkingStep> findByJobExecutionIdOrderByStepOrderAsc(Long jobExecutionId);

    int countByJobExecutionId(Long jobExecutionId);
}
