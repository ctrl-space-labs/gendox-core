package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.ObjectNode;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.AiToolHandler;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.ToolExecutionContext;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.DocumentInstanceDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.DocumentInstanceSectionDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.services.DocumentSectionService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.EmbeddingService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.templates.agents.FileListing;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.security.NoSuchAlgorithmException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

@Component
public class AdvancedSearchTool implements AiToolHandler {

    public static final String TOOL_NAME = "advanced_search";

    private static final Logger logger = LoggerFactory.getLogger(AdvancedSearchTool.class);

    private final EmbeddingService embeddingService;
    private final DocumentSectionService documentSectionService;
    private final ObjectMapper objectMapper;

    @Autowired
    public AdvancedSearchTool(EmbeddingService embeddingService, DocumentSectionService documentSectionService, ObjectMapper objectMapper) {
        this.embeddingService = embeddingService;
        this.documentSectionService = documentSectionService;
        this.objectMapper = objectMapper;
    }

    @Override
    public String getName() {
        return TOOL_NAME;
    }

    @Override
    public String getDescription() {
        return "Compose a single semantic-search query for the vector store and return the matching document sections. " +
                "Each result names its file, the lines it covers and when the file was last modified, then its text with line numbers.";
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
        } catch (JacksonException e) {
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

        String truncatedQuery = searchQuery.substring(0, Math.min(searchQuery.length(), 100));
        logger.info("AdvancedSearchTool: execute (parentThreadId={}, query={})",
                context.parentMessage() != null ? context.parentMessage().getThreadId() : null,
                truncatedQuery);

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
     * The search results as the tool response. Each hit is a part of a file: the file's line with the lines
     * the part covers, then its text numbered as read_document numbers it, so a hit goes straight into
     * line_ranges. section_id and document_id stay as fields: the answer's sources are read from them.
     *
     * <pre>{@code
     * {
     *   "search_query": "hydraulic hose pressure rating",
     *   "sections": [
     *     {
     *       "section_id": "3fa85f64-…",
     *       "document_id": "1c4b2e90-…",
     *       "file": "./knowledge/Hydraulic Systems Manual.pdf | lines=120-158 | modified=2026-11-12 14:03 | distance=0.12 | UUID=1c4b2e90-…",
     *       "source": "https://example.com/docs/hydraulics",
     *       "section_text": "120 | Hoses rated above 350 bar must be …\n121 | …"
     *     }
     *   ]
     * }
     * }</pre>
     */
    private JsonNode buildResult(String searchQuery, List<DocumentInstanceSectionDTO> sections) {
        ObjectNode result = objectMapper.createObjectNode();
        result.put("search_query", searchQuery);
        Map<UUID, Map<UUID, Integer>> firstLinesByDocument = new HashMap<>();

        ArrayNode sectionsArray = result.putArray("sections");
        for (DocumentInstanceSectionDTO section : sections) {
            DocumentInstanceDTO document = Optional.ofNullable(section.getDocumentInstanceDTO()).orElseGet(DocumentInstanceDTO::new);
            List<String> lines = List.of(Objects.toString(section.getSectionValue(), "").split("\\R", -1));
            // a section of another project (ProvenAI) is not in a document of this one: it has no lines here
            Integer firstLine = document.getId() == null ? null
                    : firstLinesByDocument.computeIfAbsent(document.getId(), documentSectionService::getSectionFirstLines)
                    .get(section.getId());

            ObjectNode sectionNode = sectionsArray.addObject();
            sectionNode.put("section_id", Objects.toString(section.getId(), null));
            sectionNode.put("document_id", Objects.toString(document.getId(), null));
            sectionNode.put("file", FileListing.line(FileListing.KNOWLEDGE,
                    FileListing.name(document.getTitle(), document.getRemoteUrl()),
                    "lines", firstLine == null ? null : firstLine + "-" + (firstLine + lines.size() - 1),
                    "modified", FileListing.modified(document.getUpdateAt()),
                    "distance", section.getDistanceFromQuestion() == null ? null
                            : Math.round(section.getDistanceFromQuestion() * 1000) / 1000.0,
                    "UUID", document.getId()));
            sectionNode.put("source", document.getExternalUrl());
            sectionNode.put("section_text", firstLine == null ? section.getSectionValue()
                    : DocumentSectionService.toNumberedText(lines, firstLine));
        }
        return result;
    }
}
