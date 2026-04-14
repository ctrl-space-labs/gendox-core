package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.AiToolHandler;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.ToolExecutionContext;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.UserProfile;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.RegexSearchResultDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.services.DocumentSectionService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.UserService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * AI tool entry point for {@link DocumentSectionService#searchDocumentsWithRegex}.
 */
@Component
public class RegexSearchTool implements AiToolHandler {

    private static final Logger logger = LoggerFactory.getLogger(RegexSearchTool.class);

    private final DocumentSectionService documentSectionService;
    private final UserService userService;
    private final SecurityUtils securityUtils;
    private final ObjectMapper objectMapper;

    public RegexSearchTool(DocumentSectionService documentSectionService,
                           UserService userService,
                           SecurityUtils securityUtils,
                           ObjectMapper objectMapper) {
        this.documentSectionService = documentSectionService;
        this.userService = userService;
        this.securityUtils = securityUtils;
        this.objectMapper = objectMapper;
    }

    @Override
    public String getName() {
        return "regex_search";
    }

    @Override
    public String getDescription() {
        return "Search one or more documents for lines that match any of the provided regular expressions. " +
                "Returns each matching line with its line number, the matching pattern, and the document it came from. " +
                "Useful for locating specific dates, numbers, string literals, or any structured text.";
    }

    @Override
    public JsonNode getParametersSchema() {
        String schemaJson = """
                {
                  "type": "object",
                  "required": ["patterns", "document_ids"],
                  "properties": {
                    "patterns": {
                      "type": "array",
                      "description": "List of Java regular expression patterns to search for.",
                      "items": { "type": "string" },
                      "minItems": 1
                    },
                    "document_ids": {
                      "type": "array",
                      "description": "List of document UUIDs to search in.",
                      "items": { "type": "string", "format": "uuid" },
                      "minItems": 1
                    },
                    "case_insensitive": {
                      "type": "boolean",
                      "description": "When true, pattern matching ignores letter case. Defaults to true.",
                      "default": true
                    }
                  },
                  "additionalProperties": false
                }
                """;
        try {
            return objectMapper.readTree(schemaJson);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Invalid JSON schema in RegexSearchTool", e);
        }
    }

    @Override
    public JsonNode execute(JsonNode argumentsNode, ToolExecutionContext context) throws GendoxException {
        JsonNode arguments;
        try {
            arguments = objectMapper.readTree(argumentsNode.asText());
        } catch (Exception e) {
            try {
                arguments = argumentsNode.isObject() ? argumentsNode : objectMapper.readTree(argumentsNode.toString());
            } catch (Exception ex) {
                throw new IllegalArgumentException("Invalid tool arguments JSON: " + argumentsNode, ex);
            }
        }

        boolean caseInsensitive = arguments.path("case_insensitive").asBoolean(true);

        List<String> rawPatterns = new ArrayList<>();
        for (JsonNode patNode : arguments.get("patterns")) {
            rawPatterns.add(patNode.asText());
        }

        List<UUID> documentIds = new ArrayList<>();
        for (JsonNode docIdNode : arguments.get("document_ids")) {
            UUID docId = UUID.fromString(docIdNode.asText());
            validateAccess(context, docId);
            documentIds.add(docId);
        }

        RegexSearchResultDTO resultDto = documentSectionService.searchDocumentsWithRegex(documentIds, rawPatterns, caseInsensitive);

        logger.debug("RegexSearchTool: found {} matches across {} documents",
                resultDto.totalMatches(), documentIds.size());
        return objectMapper.valueToTree(resultDto);
    }

    private void validateAccess(ToolExecutionContext context, UUID docId) throws GendoxException {
        UserProfile agentProfile = userService.getUserProfileByUniqueIdentifier(
                context.agent().getUserId().toString());
        boolean canAccess = securityUtils.hasAuthority(agentProfile, "OP_READ_DOCUMENT",
                securityUtils.getRequestedDocumentIdAccessCriteria(docId.toString()));
        if (!canAccess) {
            throw new GendoxException("FORBIDDEN_AGENT_ACCESS_TO_DOCUMENT",
                    "Agent tried to access document " + docId + " without proper permissions.",
                    HttpStatus.FORBIDDEN);
        }
    }
}
