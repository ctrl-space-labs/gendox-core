package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine;

import dev.ctrlspace.gendox.gendoxcoreapi.model.AiTools;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectAgent;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.CancellationToken;
import org.jetbrains.annotations.Nullable;

public record ToolExecutionContext(
        Project project,
        ProjectAgent agent,
        Message message,
        AiTools toolDefinition,
        @Nullable CancellationToken cancellationToken
) {
    public ToolExecutionContext(Project project, ProjectAgent agent, Message message, AiTools toolDefinition) {
        this(project, agent, message, toolDefinition, null);
    }
}
