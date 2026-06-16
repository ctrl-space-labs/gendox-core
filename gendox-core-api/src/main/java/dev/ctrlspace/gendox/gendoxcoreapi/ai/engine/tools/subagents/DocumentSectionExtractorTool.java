package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.subagents;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.AiToolHandler;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.ToolExecutionContext;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.UserProfile;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.CompletionRuntimeOverridesDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.services.CompletionService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.DocumentSectionService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.MessageService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.UserService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Scans a large reference document and returns the line-ranges that are relevant
 * to a given contract summary.
 *
 * <p>Use this tool when a contract references a master/framework document that is too
 * large to include in its entirety. The tool asks an LLM sub-agent to read the full
 * document and identify the specific line ranges that overlap with the contract.
 * The returned ranges can then be fed back into {@code read_document} (via its
 * {@code line_ranges} parameter) to load only the relevant portions.
 */
@Component
public class DocumentSectionExtractorTool implements AiToolHandler {

    private static final Logger logger = LoggerFactory.getLogger(DocumentSectionExtractorTool.class);

    private final CompletionService completionService;
    private final DocumentSectionService documentSectionService;
    private final MessageService messageService;
    private final UserService userService;
    private final SecurityUtils securityUtils;
    private final ObjectMapper objectMapper;
    private final SummarizerSubAgentTool summarizerSubAgentTool;
    private final CreateSubAgentTool createSubAgentTool;

    public DocumentSectionExtractorTool(@Lazy CompletionService completionService,
                                        DocumentSectionService documentSectionService,
                                        MessageService messageService,
                                        UserService userService,
                                        SecurityUtils securityUtils,
                                        ObjectMapper objectMapper,
                                        @Lazy SummarizerSubAgentTool summarizerSubAgentTool,
                                        @Lazy CreateSubAgentTool createSubAgentTool) {
        this.completionService = completionService;
        this.documentSectionService = documentSectionService;
        this.messageService = messageService;
        this.userService = userService;
        this.securityUtils = securityUtils;
        this.objectMapper = objectMapper;
        this.summarizerSubAgentTool = summarizerSubAgentTool;
        this.createSubAgentTool = createSubAgentTool;
    }

    @Override
    public String getName() {
        return "extract_relevant_sections";
    }

    @Override
    public String getDescription() {
        return "Scan a large reference document and return the line ranges that are relevant to a given task description. " +
                "Provide the UUID of the large document and a summary of the contract (or the specific topic to look for). " +
                "Returns a JSON array of {line_start, line_end} objects that can be passed to read_document as line_ranges.";
    }

    @Override
    public JsonNode getParametersSchema() {
        String schemaJson = """
                {
                  "type": "object",
                  "required": ["document_id", "task_description"],
                  "properties": {
                    "document_id": {
                      "type": "string",
                      "format": "uuid",
                      "description": "UUID of the large reference document to scan."
                    },
                    "task_description": {
                      "type": "string",
                      "description": "Summary of the contract (or topic description) used to identify relevant sections in the large document."
                    }
                  },
                  "additionalProperties": false
                }
                """;
        try {
            return objectMapper.readTree(schemaJson);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Invalid JSON schema in DocumentSectionExtractorTool", e);
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

        UUID docId = UUID.fromString(arguments.get("document_id").asText());
        String contractSummary = arguments.get("task_description").asText();

        validateAccess(context, docId);

        String documentText = documentSectionService.getFullNumberedDocumentText(docId);

        logger.info("DocumentSectionExtractorTool: scanning document {} ({} chars) for relevant sections",
                docId, documentText.length());

        String prompt = """
                <Document>
                %s
                </Document>
                
                For the above document, extract any text parts that refer to the following <summary>.
                The output must be a JSON array where each element has "line_start" and "line_end" fields
                describing the inclusive line numbers of sections related to the summary.
                
                Be generous with your selection — it is better to include a slightly wider range than to
                miss relevant content. Remove only parts that are completely unrelated to the summary.
                If a relevant topic spans a paragraph, include the whole paragraph.
                
                <summary>
                %s
                </summary>
                
                Return ONLY the JSON array, with no additional explanation. Example format:
                 {
                   "document_id": "123",
                   "line_ranges": [
                     {"line_start": 1, "line_end": 25},
                     {"line_start": 100, "line_end": 200},
                     {"line_start": 500, "line_end": 800}
                   ]
                 }
                """.formatted(documentText, contractSummary);

        Message subAgentMessage = new Message();
        subAgentMessage.setValue(prompt);
        subAgentMessage.setRole("user");
        subAgentMessage.setProjectId(context.parentMessage().getProjectId());
        subAgentMessage.setAdditionalResources(new ArrayList<>());
        // Save before getCompletion: MessageService creates a new ChatThread and assigns threadId,
        // so every message produced inside this sub-agent's loop shares the same thread.
        subAgentMessage = messageService.createMessage(subAgentMessage);

        String systemInstructions = """
                You are a document analysis specialist. Your task is to identify the portions of a
                large document that are relevant to a given summary. You respond only with
                a JSON array of line-range objects — no prose, no explanation.
                """;

        CompletionRuntimeOverridesDTO overrides = CompletionRuntimeOverridesDTO.builder()
                .cancellationToken(context.cancellationToken())
                .excludedToolNames(List.of(this.getName(), createSubAgentTool.getName(), summarizerSubAgentTool.getName()))
                .systemPrompt(systemInstructions)
                .build();

        try {
            logger.debug("DocumentSectionExtractorTool: sending document scanning task to sub-agent for document {}", docId);
            List<Message> responses = completionService.getCompletion(
                    subAgentMessage,
                    new ArrayList<>(),
                    context.project(),
                    null,
                    overrides
            );

            String rawResponse = responses.stream()
                    .filter(m -> "assistant".equals(m.getRole()))
                    .reduce((first, second) -> second)
                    .map(Message::getValue)
                    .orElse("[]");


            ObjectNode result = objectMapper.createObjectNode();
            result.put("document_id", docId.toString());
            result.put("line_ranges", rawResponse);

            logger.debug("DocumentSectionExtractorTool: found relevant ranges in document {}", docId);
            return result;

        } catch (GendoxException e) {
            if ("DEEP_THINKING_CANCELLED".equals(e.getErrorCode())) {
                throw e;
            }
            logger.error("DocumentSectionExtractorTool failed for document {}: {}", docId, e.getMessage(), e);
            ObjectNode result = objectMapper.createObjectNode();
            result.put("status", "failed");
            result.put("error", e.getMessage());
            return result;
        }
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
