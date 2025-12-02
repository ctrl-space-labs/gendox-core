package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.AiToolHandler;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.ToolExecutionContext;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.services.DocumentSectionService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ProjectService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class ReadDocumentTool implements AiToolHandler {

    private final ProjectService projectService;
    private final ObjectMapper objectMapper;
    private final DocumentSectionService documentSectionService;

    @Autowired
    public ReadDocumentTool(ProjectService projectService,
                            ObjectMapper objectMapper,
                            DocumentSectionService documentSectionService) {
        this.projectService = projectService;
        this.objectMapper = objectMapper;
        this.documentSectionService = documentSectionService;
    }

    @Override
    public String getName() {
        return "read_document";
    }

    @Override
    public String getDescription() {
        return "Read the full text of a document by its ID.";
    }

    @Override
    public JsonNode getParametersSchema() {
        String schemaJson = """
            {
              "type": "object",
              "properties": {
                "document_id": {
                  "type": "string",
                  "format": "uuid",
                  "description": "The UUID of the document to read."
                }
              },
              "required": ["document_id"]
            }
            """;

        try {
            return objectMapper.readTree(schemaJson);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Invalid JSON schema in ReadDocument tool", e);
        }
    }

    @Override
    public JsonNode execute(JsonNode argumentsNode, ToolExecutionContext context) throws GendoxException {
        // original argumentsNode is a JSON string, so we need to parse it
        JsonNode arguments;
        try {
            arguments = objectMapper.readTree(argumentsNode.asText());
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid tool arguments JSON: " + argumentsNode, e);
        }

        UUID docId = UUID.fromString(arguments.get("document_id").asText());
        String docText = documentSectionService.getFullDocumentText(docId);

        ObjectNode result = objectMapper.createObjectNode();
        result.put("document_id", docId.toString());
        result.put("document_text",
                """
                %s
                """.formatted(docText));
        //Consider adding the document title or other metadata if needed
        return result;
    }

}
