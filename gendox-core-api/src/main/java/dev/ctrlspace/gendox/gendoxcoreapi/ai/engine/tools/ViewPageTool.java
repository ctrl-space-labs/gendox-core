package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools;

import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ContentPart;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.AgentDocumentAccess;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.DefinedToolHandler;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.ToolExecutionContext;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.documents.DocPageToImageOptions;
import dev.ctrlspace.gendox.gendoxcoreapi.services.DocumentService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.DownloadService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.util.UUID;

/**
 * Shows the agent a page of a document as an image: what tells a scan from a page of text, and how to read a
 * table, a figure or a layout. The page is printed as the Digitization task prints it.
 */
@Component
public class ViewPageTool extends DefinedToolHandler {

    static final String DEFINITION = """
            {
              "name": "view_page",
              "description": "Look at one page of a document as an image. Use it for a scan (many pages, almost no tokens), a table, a figure or a layout that the text does not carry. Works for PDF, Word and PowerPoint files and for images. The page is shown to you right after the tool results.",
              "parameters": {
                "type": "object",
                "required": ["document_id", "page"],
                "properties": {
                  "document_id": { "type": "string", "format": "uuid", "description": "The UUID of the document." },
                  "page": { "type": "integer", "description": "The page to look at, starting at 1." }
                },
                "additionalProperties": false
              }
            }
            """;

    record Args(UUID document_id, int page) {
    }

    private final DocumentService documentService;
    private final DownloadService downloadService;
    private final AgentDocumentAccess documentAccess;
    private final ObjectMapper objectMapper;

    public ViewPageTool(DocumentService documentService,
                        DownloadService downloadService,
                        AgentDocumentAccess documentAccess,
                        ObjectMapper objectMapper) {
        super(objectMapper, DEFINITION);
        this.documentService = documentService;
        this.downloadService = downloadService;
        this.documentAccess = documentAccess;
        this.objectMapper = objectMapper;
    }

    @Override
    public JsonNode execute(JsonNode arguments, ToolExecutionContext context) throws GendoxException {
        Args args = readArguments(objectMapper, arguments, Args.class);
        documentAccess.requireReadable(context, args.document_id());
        DocumentInstance document = documentService.getDocumentInstanceById(args.document_id());

        int pages = document.getNumberOfPages() == null ? 1 : document.getNumberOfPages();
        if (args.page() < 1 || args.page() > pages) {
            throw new GendoxException("PAGE_OUT_OF_RANGE", "The document has " + pages + " page(s).", HttpStatus.BAD_REQUEST);
        }

        context.images().add(ContentPart.builder()
                .type("image_url")
                .imageUrl(ContentPart.ImageInput.builder().url(print(document.getRemoteUrl(), args.page() - 1)).build())
                .build());
        return objectMapper.createObjectNode()
                .put("status", "Page " + args.page() + " of " + pages + " follows the tool results, as an image.");
    }

    private String print(String url, int pageIndex) throws GendoxException {
        // a copy just for this page, deleted with what was made from it
        String prefix = "view-page-" + UUID.randomUUID();
        try {
            if (downloadService.isImageFile(downloadService.getFileExtension(url))) {
                return downloadService.readDocumentImageToBase64(url);
            }
            return downloadService.printDocumentPages(url, downloadService.downloadToTemp(url, prefix),
                    DocPageToImageOptions.builder().minSide(1024).imageSharpen(0f).pageFrom(pageIndex).pageTo(pageIndex).build())
                    .getFirst();
        } catch (IOException e) {
            throw new GendoxException("PAGE_NOT_PRINTED", "The page could not be printed.", HttpStatus.INTERNAL_SERVER_ERROR);
        } finally {
            try {
                downloadService.deleteTempFiles(prefix);
            } catch (IOException ignored) {
                // the copy stays in the temp directory
            }
        }
    }
}
