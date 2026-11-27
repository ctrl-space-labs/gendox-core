package dev.ctrlspace.gendox.gendoxcoreapi.services;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.AiModelMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ContentPart;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.AiToolRegistry;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.ToolExecutionContext;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxRuntimeException;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.ToolsHandlerAdvice;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiTools;
import dev.ctrlspace.gendox.gendoxcoreapi.model.CompletionTurn.PendingCall;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Runs the tool calls of one assistant message. It is the one place where a call is looked at before
 * it runs: is the tool offered, where does it run, and does the turn wait for it.
 */
@Service
public class ToolExecutionService {

    /**
     * What a round of tool calls gave.
     *
     * @param results the tool messages of the calls that ran, in the order of the calls
     * @param pending the CLIENT calls left for the client to answer; they get no tool message here
     * @param images  what the tools showed the model (view_page), in the order of the calls
     */
    public record ToolRound(List<AiModelMessage> results, List<PendingCall> pending, List<ContentPart> images) {
    }

    private final AiToolRegistry aiToolRegistry;
    private final ObjectMapper objectMapper;
    private final ToolsHandlerAdvice toolsHandlerAdvice;

    public ToolExecutionService(AiToolRegistry aiToolRegistry, ObjectMapper objectMapper, ToolsHandlerAdvice toolsHandlerAdvice) {
        this.aiToolRegistry = aiToolRegistry;
        this.objectMapper = objectMapper;
        this.toolsHandlerAdvice = toolsHandlerAdvice;
    }

    /**
     * @param assistantMessage the saved assistant message that carries the tool calls
     * @param history          the messages of the completion so far, for tools that start one of their own
     * @param canWait          whether CLIENT tools are left for the client to answer
     */
    public ToolRound run(Message assistantMessage, List<AiModelMessage> history, CompletionRuntimeContext context,
                         CompletionListener listener, boolean canWait) {
        Map<String, AiTools> toolMap = new HashMap<>();
        //map available tools for quick lookup, parse the jsonSchema to JsonNode and find the .function.name property
        context.availableTools().forEach(tool -> {

            JsonNode functionObj = null; // json_schema is the whole function block
            try {
                functionObj = objectMapper.readTree(tool.getJsonSchema());
            } catch (JacksonException e) {
                throw new GendoxRuntimeException(HttpStatus.BAD_REQUEST, "AI_TOOL_NOT_PROPER_JSON_SCHEMA", "Tool json schema is not a valid JSON", e);
            }
            String toolName = functionObj.get("name").asText();
            toolMap.put(toolName, tool);
        });


        List<AiModelMessage> toolExecutionMessages = new ArrayList<>();
        List<PendingCall> pendingCalls = new ArrayList<>();
        List<JsonNode> clientToolCalls = new ArrayList<>();
        List<ContentPart> images = new ArrayList<>();

        assistantMessage.getToolCalls().forEach(toolCall -> {
            String toolName = toolCall.get("function").get("name").asText();
            AiTools toolDefinition = toolMap.get(toolName);
            if (toolDefinition == null) {
                // The model called a tool it was not offered. Nothing runs: it is told which tools it has
                toolExecutionMessages.add(toolMessage(toolCall, notOffered(toolCall, toolMap)));
                return;
            }

            // Tools without a backend handler run on the page or app that sent the message
            boolean runsOnClient = !aiToolRegistry.supports(toolName);
            // A tool that asks first waits for the user's answer, also when the page only acts on it
            boolean asksFirst = runsOnClient && toolDefinition.isRequiresApproval();
            if (runsOnClient && canWait && ("CLIENT".equals(toolDefinition.getExecution()) || asksFirst)) {
                pendingCalls.add(new PendingCall(toolCall.get("id").asText(), assistantMessage.getId(), toolName,
                        toolCall.get("function").get("arguments").asText(), toolDefinition.getExecution(),
                        toolDefinition.isRequiresApproval()));
                return;
            }
            if (asksFirst) {
                // The turn cannot wait for an answer any more, so the call does not run
                toolExecutionMessages.add(toolMessage(toolCall, objectMapper.createObjectNode()
                        .put("declined", true)
                        .put("message", "This tool runs only after the user allows it, and this turn could not wait for an answer. Ask the user, then call it again in a new turn.")));
                return;
            }

            JsonNode result;
            if (runsOnClient) {
                // The page or app acts on the call; the agent is told it was executed
                clientToolCalls.add(toolCall);
                result = objectMapper.createObjectNode().put("status", "executed");
            } else {
                JsonNode args = toolCall.get("function").get("arguments");
                ToolExecutionContext ctx = new ToolExecutionContext(context.project(), context.agent(), assistantMessage, history, toolDefinition, context.cancellationToken(), images);
                result = aiToolRegistry.execute(toolName, args, ctx);
            }

            toolExecutionMessages.add(toolMessage(toolCall, result));
        });

        if (!clientToolCalls.isEmpty()) {
            listener.onClientToolCalls(assistantMessage, clientToolCalls);
        }
        return new ToolRound(toolExecutionMessages, pendingCalls, images);
    }

    /**
     * The results of tool calls the output limit cut short: none of them runs, since its arguments
     * may end halfway. Each call gets an error the model reads like any other tool error, so it
     * can write smaller or build in steps. Every call needs a result, or the next request is refused.
     */
    public List<AiModelMessage> cutShort(Message assistantMessage) {
        List<AiModelMessage> results = new ArrayList<>();
        assistantMessage.getToolCalls().forEach(toolCall -> {
            String toolName = toolCall.get("function").get("name").asText();
            GendoxException error = new GendoxException("TOOL_CALL_CUT_SHORT",
                    "Your output ran out before this call was complete, so it was not run. "
                            + "Make it smaller: write more compact content, or create a smaller first version and add to it with further calls.",
                    HttpStatus.BAD_REQUEST);
            results.add(toolMessage(toolCall, objectMapper.valueToTree(
                    toolsHandlerAdvice.handleToolException(error, toolName, toolCall.get("function").get("arguments"), null))));
        });
        return results;
    }

    private static AiModelMessage toolMessage(JsonNode toolCall, JsonNode result) {
        AiModelMessage message = new AiModelMessage();
        message.setRole("tool");
        message.setToolCallId(toolCall.get("id").asText());
        message.setName(toolCall.get("function").get("name").asText());
        message.setContent(result.toString());
        return message;
    }

    /**
     * The error a failed tool gives, so the model reads it the same way and corrects its call.
     */
    private JsonNode notOffered(JsonNode toolCall, Map<String, AiTools> offered) {
        String toolName = toolCall.get("function").get("name").asText();
        String available = offered.isEmpty() ? "No tools are available."
                : "Available tools: " + offered.keySet().stream().sorted().collect(Collectors.joining(", "));
        GendoxException error = new GendoxException("AI_TOOL_NOT_FOUND",
                "Tool " + toolName + " is not available. " + available, HttpStatus.BAD_REQUEST);
        return objectMapper.valueToTree(toolsHandlerAdvice.handleToolException(error, toolName, toolCall.get("function").get("arguments"), null));
    }
}
