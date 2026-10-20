package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.assistant;

import com.fasterxml.jackson.databind.JsonNode;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.AiToolHandler;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.ToolExecutionContext;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;

/**
 * A tool of the in-app assistant that reads or changes the tasks of the agent's project. Its
 * definition is its AI_TOOL_EXAMPLES row, like any other tool, and a skill brings it to an agent by
 * naming it in {@code allowed-tools}. Its arguments are read into a typed record {@code A}. Every
 * call first checks that the person behind the chat may update the project.
 */
public abstract class AssistantTaskTool<A> implements AiToolHandler {

    protected final AssistantToolSupport support;
    private final String name;
    private final Class<A> argumentsType;

    protected AssistantTaskTool(AssistantToolSupport support, String name, Class<A> argumentsType) {
        this.support = support;
        this.name = name;
        this.argumentsType = argumentsType;
    }

    protected abstract JsonNode run(A args, ToolExecutionContext context) throws GendoxException;

    @Override
    public final JsonNode execute(JsonNode arguments, ToolExecutionContext context) throws GendoxException {
        A args = support.readArguments(arguments, argumentsType);
        support.requireProjectMember(context);
        return run(args, context);
    }

    @Override
    public String getName() {
        return name;
    }

    @Override
    public String getDescription() {
        return support.toolExample(name).path("description").asText(null);
    }

    @Override
    public JsonNode getParametersSchema() {
        return support.toolExample(name).path("parameters");
    }
}
