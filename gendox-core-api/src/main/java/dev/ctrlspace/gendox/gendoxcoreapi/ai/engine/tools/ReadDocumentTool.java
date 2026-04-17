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
import dev.ctrlspace.gendox.gendoxcoreapi.services.ProjectService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.UserService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Component
public class ReadDocumentTool implements AiToolHandler {

    private final UserService userService;
    Logger logger = LoggerFactory.getLogger(ReadDocumentTool.class);

    private final ProjectService projectService;
    private final ObjectMapper objectMapper;
    private final DocumentSectionService documentSectionService;
    private final SecurityUtils securityUtils;

    @Autowired
    public ReadDocumentTool(ProjectService projectService,
                            ObjectMapper objectMapper,
                            DocumentSectionService documentSectionService, SecurityUtils securityUtils, UserService userService) {
        this.projectService = projectService;
        this.objectMapper = objectMapper;
        this.documentSectionService = documentSectionService;
        this.securityUtils = securityUtils;
        this.userService = userService;
    }

    @Override
    public String getName() {
        return "read_document";
    }

    @Override
    public String getDescription() {
        return "Read the full text of a document by its ID. " +
                "Optionally provide line_ranges (array of {line_start, line_end}) to return only specific portions. " +
                "Ranges are expanded to bring in surrounding context.";
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
                },
                "line_ranges": {
                  "type": "array",
                  "description": "Optional. When provided, only lines within these ranges are returned. Ranges are expanded to bring in surrounding context.",
                  "items": {
                    "type": "object",
                    "required": ["line_start", "line_end"],
                    "properties": {
                      "line_start": { "type": "integer", "description": "First line number (inclusive)." },
                      "line_end":   { "type": "integer", "description": "Last line number (inclusive)." }
                    }
                  }
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
        JsonNode arguments;
        try {
            arguments = objectMapper.readTree(argumentsNode.asText());
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid tool arguments JSON: " + argumentsNode, e);
        }

        UUID docId = UUID.fromString(arguments.get("document_id").asText());
        logger.info("ReadDocumentTool: execute (parentThreadId={}, documentId={})",
                context.parentMessage() != null ? context.parentMessage().getThreadId() : null,
                docId);

        validateAgentHasAccessToReadTheDoc(context, docId);

        String docText = documentSectionService.getFullNumberedDocumentText(docId);

        logger.debug("ReadDocumentTool: document {} loaded, {} characters", docId, docText.length());

        JsonNode lineRangesNode = arguments.get("line_ranges");
        if (lineRangesNode != null && lineRangesNode.isArray() && !lineRangesNode.isEmpty()) {
            docText = filterByLineRanges(docText, lineRangesNode);
            logger.debug("ReadDocumentTool: filtered to {} characters using {} raw range(s)",
                    docText.length(), lineRangesNode.size());
        }

        ObjectNode result = objectMapper.createObjectNode();
        result.put("document_id", docId.toString());
        result.put("document_text", "\n" + docText + "\n");
        return result;
    }

    private record Range(int startLine, int endLine) {
        Range {
            if (startLine > endLine) throw new IllegalArgumentException("startLine must be <= endLine");
        }

        Range expand(int margin) {
            return new Range(Math.max(1, startLine - margin), endLine + margin);
        }

        boolean closeOrOverlaps(Range next) {
            return next.startLine - this.endLine <= 25;
        }

        Range mergeWith(Range other) {
            return new Range(Math.min(this.startLine, other.startLine), Math.max(this.endLine, other.endLine));
        }

        boolean contains(int lineNum) {
            return lineNum >= startLine && lineNum <= endLine;
        }
    }

    /**
     * Filters {@code fullText} (which already has {@code "N | line"} prefixes) to only lines
     * covered by the supplied ranges after expansion and merging.
     *
     * <p>Expansion: each side grows by 15% of the range length (rounded up), clamped to line 1.
     * Merging: ranges that overlap or whose gap is ≤ 30 lines are collapsed into one.
     */
    private String filterByLineRanges(String fullText, JsonNode lineRangesNode) {
        // Parse raw ranges
        List<Range> ranges = new ArrayList<>();
        for (JsonNode rangeNode : lineRangesNode) {
            int start = rangeNode.get("line_start").asInt();
            int end   = rangeNode.get("line_end").asInt();
            if (start > end) { int tmp = start; start = end; end = tmp; }
            ranges.add(new Range(start, end));
        }

        // Expand each range by 15% on each side
        List<Range> expanded = ranges.stream()
                .map(r -> r.expand((int) Math.ceil((r.endLine() - r.startLine() + 1) * 0.15)))
                .sorted(Comparator.comparingInt(Range::startLine))
                .collect(java.util.stream.Collectors.toCollection(ArrayList::new));

        // Merge overlapping / close ranges
        List<Range> merged = new ArrayList<>();
        for (Range r : expanded) {
            if (merged.isEmpty() || !merged.getLast().closeOrOverlaps(r)) {
                merged.add(r);
            } else {
                merged.set(merged.size() - 1, merged.getLast().mergeWith(r));
            }
        }

        // Walk the merged ranges, emitting "..." between non-adjacent sections
        String[] lines = fullText.split("\n", -1);
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < merged.size(); i++) {
            if (i > 0) {
                sb.append("...\n");
            }
            Range r = merged.get(i);
            for (int lineNum = r.startLine(); lineNum <= r.endLine() && lineNum <= lines.length; lineNum++) {
                sb.append(lines[lineNum - 1]).append("\n");
            }
        }
        return sb.toString();
    }

    private void validateAgentHasAccessToReadTheDoc(ToolExecutionContext context, UUID docId) throws GendoxException {
        UserProfile agentUserProfile = userService.getUserProfileByUniqueIdentifier(context.agent().getUserId().toString());
        boolean canAccessDoc = securityUtils.hasAuthority(agentUserProfile, "OP_READ_DOCUMENT",
                securityUtils.getRequestedDocumentIdAccessCriteria(docId.toString()));
        if (!canAccessDoc) {
            logger.error("Agent with id: {}, tried to access document without permission: {}, in thread {}",
                    context.agent().getId(), docId, context.parentMessage().getThreadId());

            throw new GendoxException("FORBIDDEN_AGENT_ACCESS_TO_DOCUMENT",
                    "Agent tried to access document with id:" + docId + " without proper permissions.",
                    HttpStatus.FORBIDDEN);
        }
    }

}
