package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.AiToolHandler;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.ToolExecutionContext;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.UserProfile;
import dev.ctrlspace.gendox.gendoxcoreapi.services.DocumentSectionService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.UserService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import org.bitbucket.cowwoc.diffmatchpatch.DiffMatchPatch;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

/**
 * Compares two documents and returns their differences, in the spirit of {@code git diff}.
 *
 * <p>The <em>original</em> document ({@code a}) is the baseline; the <em>modified</em>
 * document ({@code b}) is what changed.  Uses the
 * <a href="https://github.com/google/diff-match-patch">diff-match-patch</a> library.
 * The result is a compact list of hunks — each hunk carries an operation
 * ({@code EQUAL}, {@code INSERT}, or {@code DELETE}) and the affected text.
 * Equal segments may be trimmed in long unchanged runs; see {@link DocumentSectionService#diffDocuments}.
 */
@Component
public class DocumentDiffTool implements AiToolHandler {

    private static final Logger logger = LoggerFactory.getLogger(DocumentDiffTool.class);

    private final DocumentSectionService documentSectionService;
    private final UserService userService;
    private final SecurityUtils securityUtils;
    private final ObjectMapper objectMapper;

    public DocumentDiffTool(DocumentSectionService documentSectionService,
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
        return "diff_documents";
    }

    @Override
    public String getDescription() {
        return "Compare two documents and return their differences, similar to `git diff a b`. " +
                "Provide the UUID of the original document (a) and the UUID of the modified document (b). " +
                "DELETE hunks are lines present only in (a); INSERT hunks are lines present only in (b); " +
                "EQUAL hunks show unchanged context around each change.";
    }

    @Override
    public JsonNode getParametersSchema() {
        String schemaJson = """
                {
                  "type": "object",
                  "required": ["document_a_id", "document_b_id"],
                  "properties": {
                    "document_a_id": {
                      "type": "string",
                      "format": "uuid",
                      "description": "UUID of the original (baseline) document — analogous to the left side of a diff."
                    },
                    "document_b_id": {
                      "type": "string",
                      "format": "uuid",
                      "description": "UUID of the modified document — analogous to the right side of a diff."
                    }
                  },
                  "additionalProperties": false
                }
                """;
        try {
            return objectMapper.readTree(schemaJson);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Invalid JSON schema in DocumentDiffTool", e);
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

        UUID docAId = UUID.fromString(arguments.get("document_a_id").asText());
        UUID docBId = UUID.fromString(arguments.get("document_b_id").asText());

        validateAccess(context, docAId);
        validateAccess(context, docBId);

        List<DiffMatchPatch.Patch> patches = documentSectionService.diffDocuments(docAId, docBId);
        String patchText = documentSectionService.patchToDecodedText(patches);

        ObjectNode result = objectMapper.createObjectNode();
        result.put("document_a_id", docAId.toString());
        result.put("document_b_id", docBId.toString());
        result.put("diff_patches", patchText);

        logger.info("DocumentDiffTool: produced {} diff patches", patches.size());
        return result;
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
