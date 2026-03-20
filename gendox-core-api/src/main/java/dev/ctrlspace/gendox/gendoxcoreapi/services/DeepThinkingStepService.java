package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.model.DeepThinkingStep;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.DeepThinkingStepRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class DeepThinkingStepService {

    private final DeepThinkingStepRepository repository;

    public DeepThinkingStepService(DeepThinkingStepRepository repository) {
        this.repository = repository;
    }

    public DeepThinkingStep logStep(Long jobExecutionId, UUID threadId,
                                     String stepType, String summary, UUID messageId) {
        int nextOrder = repository.countByJobExecutionId(jobExecutionId);

        DeepThinkingStep step = DeepThinkingStep.builder()
                .jobExecutionId(jobExecutionId)
                .threadId(threadId)
                .stepOrder(nextOrder)
                .stepType(stepType)
                .summary(summary)
                .messageId(messageId)
                .createdAt(Instant.now())
                .build();

        return repository.save(step);
    }

    public List<DeepThinkingStep> getSteps(Long jobExecutionId) {
        return repository.findByJobExecutionIdOrderByStepOrderAsc(jobExecutionId);
    }
}
