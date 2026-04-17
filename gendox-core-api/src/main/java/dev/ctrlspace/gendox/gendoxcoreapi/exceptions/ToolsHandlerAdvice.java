package dev.ctrlspace.gendox.gendoxcoreapi.exceptions;

import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.io.Serializable;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * LLM tool-call error handler — the counterpart of {@link ResponseControllerAdvice} for tool executions.
 *
 * <p>While {@code ResponseControllerAdvice} converts exceptions into HTTP {@code 4xx/5xx} responses for
 * REST clients, this class converts the same exceptions into a {@link GendoxErrorResponse} that is
 * serialized and returned to the LLM as the tool-result message.  The model can then use the error
 * details (error code, message, echoed arguments, expected schema) to self-correct its next call
 * instead of silently failing.
 *
 * <p>Usage: inject {@code ToolsHandlerAdvice} wherever tool execution is dispatched (e.g.
 * {@code AiToolRegistry}), call {@link #handleToolException} in the {@code catch} blocks, then
 * serialize the returned {@link GendoxErrorResponse} into the tool message content.
 */
@Component
public class ToolsHandlerAdvice {

    private static final Logger logger = LoggerFactory.getLogger(ToolsHandlerAdvice.class);

    public static final String STATUS_EXECUTION_FAILED_WITH_ERROR = "EXECUTION_FAILED_WITH_ERROR";
    private static final int MAX_ARGUMENTS_CHARS = 4_096;

    /**
     * Maps an exception thrown during tool execution to a {@link GendoxErrorResponse}, following
     * the same branching logic as {@link ResponseControllerAdvice#handleConflict}.
     *
     * @param ex               the exception caught during tool execution
     * @param toolName         name of the tool that failed (echoed back for model context)
     * @param receivedArgs     the raw argument node the model sent (echoed back, truncated)
     * @param parametersSchema the tool's expected JSON schema so the model can repair its call
     */
    public GendoxErrorResponse handleToolException(Exception ex,
                                                   String toolName,
                                                   JsonNode receivedArgs,
                                                   JsonNode parametersSchema) {
        logger.error("Error in tool '{}' execution", toolName, ex);

        GendoxErrorResponse error = new GendoxErrorResponse();

        if (ex instanceof GendoxException gendoxException) {
            error.setHttpStatus(gendoxException.getHttpStatus().value());
            error.setHttpMessage(gendoxException.getHttpStatus().getReasonPhrase());
            error.setErrorMessage(gendoxException.getErrorMessage());
            error.setErrorCode(gendoxException.getErrorCode());
            error.setTimestamp(gendoxException.getTime());
        } else {
            error.setHttpStatus(HttpStatus.INTERNAL_SERVER_ERROR.value());
            error.setHttpMessage(HttpStatus.INTERNAL_SERVER_ERROR.getReasonPhrase());
            error.setErrorMessage(ex.getMessage() != null ? ex.getMessage() : ex.getClass().getSimpleName());
            error.setErrorCode("INTERNAL_SERVER_ERROR");
            error.setTimestamp(Instant.now());
        }

        error.setMetadata(buildMetadata(toolName, receivedArgs, parametersSchema));

        return error;
    }

    private Serializable buildMetadata(String toolName, JsonNode receivedArgs, JsonNode parametersSchema) {
        Map<String, Serializable> meta = new LinkedHashMap<>();
        meta.put("tool", toolName != null ? toolName : "");
        meta.put("received_arguments", truncate(safeJson(receivedArgs), MAX_ARGUMENTS_CHARS));
        if (parametersSchema != null && !parametersSchema.isNull()) {
            meta.put("expected_parameters_schema", parametersSchema.toString());
        }
        return (Serializable) meta;
    }

    private String safeJson(JsonNode node) {
        if (node == null || node.isNull()) return "null";
        return node.toString();
    }

    private String truncate(String s, int maxChars) {
        if (s == null || s.isBlank()) return "";
        if (s.length() <= maxChars) return s;
        return s.substring(0, maxChars - 1) + "…";
    }
}
