package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.DefinedToolHandler;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.ToolExecutionContext;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.DocumentCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.services.DocumentService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.MessageLocalContextService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.templates.agents.FileListing;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * The agent's "ls": the files it can read, in the same lines the session context uses ({@link FileListing}).
 */
@Component
public class ListFilesTool extends DefinedToolHandler {

    static final String DEFINITION = """
            {
              "name": "list_files",
              "description": "List the files you can read, one line per file: path, size, pages, tokens, last modified time (UTC) and the UUID the other tools take as document_id. Scope 'knowledge' is your knowledge base, a page at a time. Scope 'uploads' is every file attached to this conversation.",
              "parameters": {
                "type": "object",
                "required": ["scope"],
                "properties": {
                  "scope": { "type": "string", "enum": ["knowledge", "uploads"] },
                  "page": { "type": "integer", "description": "For 'knowledge': which page of 50 files, starting at 0. Defaults to 0." }
                },
                "additionalProperties": false
              }
            }
            """;

    private static final int PAGE_SIZE = 50;

    record Args(String scope, Integer page) {
    }

    private final DocumentService documentService;
    private final MessageLocalContextService messageLocalContextService;
    private final ObjectMapper objectMapper;

    public ListFilesTool(DocumentService documentService,
                         MessageLocalContextService messageLocalContextService,
                         ObjectMapper objectMapper) {
        super(objectMapper, DEFINITION);
        this.documentService = documentService;
        this.messageLocalContextService = messageLocalContextService;
        this.objectMapper = objectMapper;
    }

    @Override
    public JsonNode execute(JsonNode arguments, ToolExecutionContext context) throws GendoxException {
        Args args = readArguments(objectMapper, arguments, Args.class);

        if ("uploads".equals(args.scope())) {
            return result(FileListing.list(FileListing.UPLOADS, messageLocalContextService.getThreadFiles(context.parentMessage())));
        }

        Page<DocumentInstance> files = documentService.getAllDocuments(
                DocumentCriteria.builder().projectId(context.project().getId().toString()).build(),
                PageRequest.of(args.page() == null ? 0 : Math.max(0, args.page()), PAGE_SIZE, Sort.by("title")));
        return result(FileListing.list(FileListing.KNOWLEDGE, files.getContent())
                + "\n(page " + files.getNumber() + " of " + files.getTotalPages() + ", " + files.getTotalElements() + " files)");
    }

    private JsonNode result(String files) {
        return objectMapper.createObjectNode().put("files", files);
    }
}
