package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.AiModelRequestParams;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModel;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiTools;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectAgent;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.CancellationToken;
import org.jetbrains.annotations.Nullable;

import java.util.List;
import java.util.UUID;

/** What one completion runs with, resolved by {@link CompletionRuntimeContextResolver}. */
public record CompletionRuntimeContext(
        @Nullable Project project,
        @Nullable ProjectAgent agent,
        String question,
        String agentRole,
        AiModel completionModel,
        String completionApiKey,
        AiModelRequestParams aiModelRequestParams,
        List<AiTools> availableTools,
        UUID projectId,
        UUID organizationId,
        UUID createdByAgentUserId,
        @Nullable CancellationToken cancellationToken
) {
    public boolean hasProjectContext() {
        return project != null && agent != null;
    }
}
