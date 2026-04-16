package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.ToolsHandlerAdvice;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class AiToolRegistryTest {

    private ObjectMapper objectMapper;
    private ToolsHandlerAdvice toolsHandlerAdvice;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        toolsHandlerAdvice = new ToolsHandlerAdvice();
    }

    @Test
    void execute_whenHandlerThrowsRuntimeException_returnsStructuredErrorPayload() throws Exception {
        AiToolHandler handler = new AiToolHandler() {
            @Override
            public String getName() { return "boom_tool"; }

            @Override
            public String getDescription() { return "Boom."; }

            @Override
            public JsonNode getParametersSchema() {
                try {
                    return objectMapper.readTree("""
                            {"type":"object","properties":{"x":{"type":"integer"}}}
                            """);
                } catch (Exception e) {
                    throw new RuntimeException(e);
                }
            }

            @Override
            public JsonNode execute(JsonNode arguments, ToolExecutionContext context) {
                throw new NullPointerException("missing field line_start");
            }
        };

        AiToolRegistry registry = new AiToolRegistry(List.of(handler), objectMapper, toolsHandlerAdvice);
        JsonNode args = objectMapper.readTree("\"{\\\"line_ranges\\\":[{}]}\"");
        ToolExecutionContext ctx = new ToolExecutionContext(null, null, null, null, null, null);

        JsonNode result = registry.execute("boom_tool", args, ctx);

        assertTrue(result.has("httpStatus"));
        assertEquals(500, result.get("httpStatus").asInt());
        assertEquals("INTERNAL_SERVER_ERROR", result.get("errorCode").asText());
        assertTrue(result.get("errorMessage").asText().contains("missing field"));
        assertTrue(result.has("metadata"));
        assertEquals("boom_tool", result.get("metadata").get("tool").asText());
        assertTrue(result.get("metadata").get("received_arguments").asText().contains("line_ranges"));
        assertTrue(result.get("metadata").has("expected_parameters_schema"));
    }

    @Test
    void execute_whenHandlerThrowsGendoxException_returnsStructuredErrorPayload() throws Exception {
        AiToolHandler handler = new AiToolHandler() {
            @Override
            public String getName() { return "gendox_fail"; }

            @Override
            public String getDescription() { return "Fails with GendoxException."; }

            @Override
            public JsonNode getParametersSchema() {
                try {
                    return objectMapper.readTree("""
                            {"type":"object","properties":{"doc":{"type":"string"}}}
                            """);
                } catch (Exception e) {
                    throw new RuntimeException(e);
                }
            }

            @Override
            public JsonNode execute(JsonNode arguments, ToolExecutionContext context) throws GendoxException {
                throw new GendoxException("INVALID_TOOL_ARGUMENTS", "bad args", HttpStatus.BAD_REQUEST);
            }
        };

        AiToolRegistry registry = new AiToolRegistry(List.of(handler), objectMapper, toolsHandlerAdvice);
        JsonNode args = objectMapper.readTree("\"{\\\"doc\\\":123}\"");
        ToolExecutionContext ctx = new ToolExecutionContext(null, null, null, null, null, null);

        JsonNode result = registry.execute("gendox_fail", args, ctx);

        assertEquals(HttpStatus.BAD_REQUEST.value(), result.get("httpStatus").asInt());
        assertEquals("INVALID_TOOL_ARGUMENTS", result.get("errorCode").asText());
        assertTrue(result.get("errorMessage").asText().contains("bad args"));
        assertEquals("gendox_fail", result.get("metadata").get("tool").asText());
        assertTrue(result.get("metadata").get("received_arguments").asText().contains("doc"));
    }
}
