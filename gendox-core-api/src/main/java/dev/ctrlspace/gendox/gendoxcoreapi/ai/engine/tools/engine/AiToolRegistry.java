package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxRuntimeException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class AiToolRegistry {

    private static final Logger logger = LoggerFactory.getLogger(AiToolRegistry.class);

    private final Map<String, AiToolHandler> handlersByName;
    private final ObjectMapper objectMapper;

    public AiToolRegistry(List<AiToolHandler> handlers,
                          ObjectMapper objectMapper) {
        this.handlersByName = handlers.stream()
                .collect(Collectors.toMap(
                        AiToolHandler::getName,
                        Function.identity()
                ));
        this.objectMapper = objectMapper;
    }

    public JsonNode execute(String toolName, JsonNode args, ToolExecutionContext context)  {
        AiToolHandler handler = handlersByName.get(toolName);
        if (handler != null) {
            try {
                return handler.execute(args, context);
            } catch (GendoxException e) {
                logger.error("Failed to execute tool {}, for project {}. Skipping...",
                        toolName,
                        Optional.ofNullable(context.project()).map(p -> p.getId().toString()).orElse("no-project"));
                logger.error(e.getMessage(), e);
                // return the error notification to the LLM
                ObjectNode result = objectMapper.createObjectNode();
                result.put("status", "EXECUTION_FAILED_WITH_ERROR");
                return result;
            }

        }
        // TODO: think what to do with tools that are just passed in the browsers, and no execution is needed by BE
        // This supports only Frontend actions that do not require BE execution.
        // The tools are custom jsons in the agent's settings
        ObjectNode result = objectMapper.createObjectNode();
        result.put("status", "executed");
        return result;
    }

    public boolean supports(String toolName) {
        return handlersByName.containsKey(toolName);
    }

    /**
     * All tools, ready to send to OpenAI as "tools".
     * Delegates to the allowedToolNames variant using all registered tool names.
     */
    public ArrayNode getOpenAiToolDefinitions() {
        Set<String> allToolNames = handlersByName.keySet();
        return getOpenAiToolDefinitions(allToolNames);
    }

    public ArrayNode getOpenAiToolDefinitions(String allowedToolNames) {
        return getOpenAiToolDefinitions(List.of(allowedToolNames));
    }

    /**
     * Only tools whose names are in allowedToolNames.
     */
    public ArrayNode getOpenAiToolDefinitions(Iterable<String> allowedToolNames) {
        ArrayNode toolsArray = objectMapper.createArrayNode();

        for (String name : allowedToolNames) {
            AiToolHandler handler = handlersByName.get(name);
            if (handler == null) {
                // you can choose to throw instead of skipping, if you prefer
                continue;
            }
            toolsArray.add(buildOpenAiToolDefinition(handler));
        }

        return toolsArray;
    }

    private ObjectNode buildOpenAiToolDefinition(AiToolHandler handler) {
        ObjectNode toolNode = objectMapper.createObjectNode();
        toolNode.put("type", "function");

        ObjectNode functionNode = objectMapper.createObjectNode();
        functionNode.put("name", handler.getName());
        functionNode.put("description", handler.getDescription());
        functionNode.set("parameters", handler.getParametersSchema());

        toolNode.set("function", functionNode);
        return toolNode;
    }
}