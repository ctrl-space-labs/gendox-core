package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.AiToolHandler;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.ToolExecutionContext;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.DocumentInstanceSectionDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.services.EmbeddingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.security.NoSuchAlgorithmException;
import java.util.List;

@Component
public class AdvancedSearchTool implements AiToolHandler {

    private static final Logger logger = LoggerFactory.getLogger(AdvancedSearchTool.class);

    private final EmbeddingService embeddingService;
    private final ObjectMapper objectMapper;

    @Autowired
    public AdvancedSearchTool(EmbeddingService embeddingService, ObjectMapper objectMapper) {
        this.embeddingService = embeddingService;
        this.objectMapper = objectMapper;
    }

    @Override
    public String getName() {
        return "advanced_search";
    }

    @Override
    public String getDescription() {
        return "Compose a single semantic-search query for the vector store and return the matching document sections.";
    }

    @Override
    public JsonNode getParametersSchema() {
        String schemaJson = """
                {
                  "type": "object",
                  "required": ["search_query"],
                  "properties": {
                    "search_query": {
                      "type": "string",
                      "description": "The query to be used in the vector search in a document DB."
                    }
                  },
                  "additionalProperties": false
                }
                """;
        try {
            return objectMapper.readTree(schemaJson);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Invalid JSON schema in AdvancedSearchTool", e);
        }
    }

    @Override
    public JsonNode execute(JsonNode argumentsNode, ToolExecutionContext context) throws GendoxException {
        JsonNode arguments;
        try {
            arguments = objectMapper.readTree(argumentsNode.asText());
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid tool arguments JSON: " + argumentsNode, e);
        }

        String searchQuery = arguments.get("search_query").asText();

        logger.debug("AdvancedSearchTool executing with query: {}", searchQuery);

        int maxSearchLimit = context.agent().getMaxSearchLimit().intValue();
        int maxCompletionLimit = context.agent().getMaxCompletionLimit().intValue();
        List<DocumentInstanceSectionDTO> sections;
        try {
            sections = embeddingService.findClosestSectionsByQuery(
                    searchQuery,
                    null,
                    context.project(),
                    PageRequest.of(0, maxSearchLimit)
            );
            // keep the top #maxCompletionLimit
            sections = sections.subList(0, Math.min(sections.size(), maxCompletionLimit));

        } catch (IOException | NoSuchAlgorithmException e) {
            throw new GendoxException("ADVANCED_SEARCH_TOOL_FAILED",
                    "Advanced search tool failed to execute: " + e.getMessage(),
                    org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR, e);
        }

        logger.debug("AdvancedSearchTool found {} sections", sections.size());

        return buildResult(searchQuery, sections);
    }

    /**
     * Serializes the search results into a JSON structure returned to the LLM as the tool response.
     *
     * <p>Example output:
     * <pre>{@code
     * {
     *   "search_query": "hydraulic hose pressure rating",
     *   "sections": [
     *     {
     *       "section_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
     *       "document_id": "1c4b2e90-...",
     *       "document_title": "Hydraulic Systems Manual",
     *       "source": "https://example.com/docs/hydraulics",
     *       "section_text": "Hoses rated above 350 bar must be ...",
     *       "distance": 0.12
     *     }
     *   ]
     * }
     * }</pre>
     *
     * @param searchQuery the query that was used for the search
     * @param sections    ranked list of matching document sections
     * @return JSON node ready to be sent back to the LLM as the tool call result
     */
    private JsonNode buildResult(String searchQuery, List<DocumentInstanceSectionDTO> sections) {
        ObjectNode result = objectMapper.createObjectNode();
        result.put("search_query", searchQuery);

        ArrayNode sectionsArray = objectMapper.createArrayNode();
        for (DocumentInstanceSectionDTO section : sections) {
            ObjectNode sectionNode = objectMapper.createObjectNode();
            sectionNode.put("section_id", section.getId() != null ? section.getId().toString() : null);

            String documentId = (section.getDocumentInstanceDTO() != null && section.getDocumentInstanceDTO().getId() != null)
                    ? section.getDocumentInstanceDTO().getId().toString() : null;
            sectionNode.put("document_id", documentId);

            String documentTitle = null;
            if (section.getDocumentInstanceDTO() != null) {
                documentTitle = section.getDocumentInstanceDTO().getTitle();
                if (documentTitle == null || documentTitle.isBlank()) {
                    documentTitle = section.getDocumentInstanceDTO().getRemoteUrl();
                }
            }
            sectionNode.put("document_title", documentTitle);

            String source = (section.getDocumentInstanceDTO() != null)
                    ? section.getDocumentInstanceDTO().getExternalUrl() : null;
            sectionNode.put("source", source);

            sectionNode.put("section_text", section.getSectionValue());
            sectionNode.put("distance", section.getDistanceFromQuestion());

            sectionsArray.add(sectionNode);
        }

        result.set("sections", sectionsArray);
        return result;
    }
}
