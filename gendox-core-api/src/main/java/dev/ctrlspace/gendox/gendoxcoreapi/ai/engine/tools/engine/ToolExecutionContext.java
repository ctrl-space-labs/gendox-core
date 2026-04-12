package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.AiModelMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiTools;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectAgent;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.CancellationToken;
import org.jetbrains.annotations.Nullable;

import java.util.List;

public record ToolExecutionContext(
        Project project,
        ProjectAgent agent,
        Message parentMessage,
        List<AiModelMessage> parentPreviousMessages,
        AiTools toolDefinition,
        @Nullable CancellationToken cancellationToken
) {
}
