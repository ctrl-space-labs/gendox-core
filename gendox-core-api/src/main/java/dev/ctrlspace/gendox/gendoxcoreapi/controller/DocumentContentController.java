package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.services.DocumentService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.DownloadService;
import io.swagger.v3.oas.annotations.Operation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.core.io.Resource;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@RestController
public class DocumentContentController {

    private static final Logger logger = LoggerFactory.getLogger(DocumentContentController.class);

    private final DocumentService documentService;
    private final DownloadService downloadService;


    @Autowired
    public DocumentContentController(DocumentService documentService, DownloadService downloadService) {
        this.documentService = documentService;
        this.downloadService = downloadService;
    }

    @PreAuthorize("@securityUtils.threadHasDocumentInMessageLocalContext(#threadId, #documentId) && " +
            "(@securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedThreadIdFromPathVariable') " +
            "|| @securityUtils.isPublicThread(#threadId))")
    @GetMapping("threads/{threadId}/documents/{documentId}/content")
    @Operation(summary = "View document content (inline)",
            description = "Streams the document bytes as inline content, suitable for previews (img/iframe).")
    public ResponseEntity<Resource> viewDocumentContent(
            @PathVariable UUID threadId,
            @PathVariable UUID documentId
    ) throws GendoxException {
        logger.debug("Received request to view content for documentId: {}", documentId);
        DocumentInstance doc = documentService.getDocumentInstanceById(documentId);

        String remoteUrl = doc.getRemoteUrl();
        if (!StringUtils.hasText(remoteUrl)) {
            throw new GendoxException("DOCUMENT_REMOTE_URL_EMPTY", "Document remoteUrl is empty",
                    org.springframework.http.HttpStatus.BAD_REQUEST);
        }

        Resource resource = downloadService.openResource(remoteUrl);
        MediaType mediaType = detectMediaType(doc, resource);

        String filename = safeFilename(resource.getFilename(), doc.getTitle(), "document");
        logger.debug("Determined mediaType: {}, filename: {}", mediaType, filename);
        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, contentDispositionInline(filename))
                .body(resource);
    }


    @PreAuthorize("@securityUtils.threadHasDocumentInMessageLocalContext(#threadId, #documentId) && " +
            "(@securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedThreadIdFromPathVariable') " +
            "|| @securityUtils.isPublicThread(#threadId))")
    @GetMapping("threads/{threadId}/documents/{documentId}/download")
    @Operation(summary = "Download document (attachment)",
            description = "Forces download of the document bytes (Content-Disposition: attachment).")
    public ResponseEntity<Resource> downloadDocument(
            @PathVariable UUID threadId,
            @PathVariable UUID documentId
    ) throws GendoxException {

        logger.info("Download request for documentId: {}, threadId: {}", documentId, threadId);
        DocumentInstance doc = documentService.getDocumentInstanceById(documentId);

        String remoteUrl = doc.getRemoteUrl();
        if (!StringUtils.hasText(remoteUrl)) {
            throw new GendoxException("DOCUMENT_REMOTE_URL_EMPTY", "Document remoteUrl is empty",
                    org.springframework.http.HttpStatus.BAD_REQUEST);
        }

        Resource resource = downloadService.openResource(remoteUrl);
        MediaType mediaType = detectMediaType(doc, resource);

        String filename = safeFilename(resource.getFilename(), doc.getTitle(), "download");
        logger.info("Determined mediaType: {}, filename: {}", mediaType, filename);
        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, contentDispositionAttachment(filename))
                .body(resource);
    }

    private MediaType detectMediaType(DocumentInstance doc, Resource resource) {
        String name = resource.getFilename();
        String ext = (name != null) ? StringUtils.getFilenameExtension(name) : null;

        MediaType byExt = mediaTypeFromExtension(ext);
        if (byExt != null) return byExt;

        try {
            if (resource.isFile()) {
                Path p = Paths.get(resource.getFile().toURI());
                String probed = Files.probeContentType(p);
                if (StringUtils.hasText(probed)) {
                    return MediaType.parseMediaType(probed);
                }
            }
        } catch (Exception e) {
            logger.debug("Could not probe content-type for resource: {}", e.getMessage());
        }

        return MediaType.APPLICATION_OCTET_STREAM;
    }

    private MediaType mediaTypeFromExtension(String ext) {
        if (!StringUtils.hasText(ext)) return null;
        String e = ext.toLowerCase();

        return switch (e) {
            case "png" -> MediaType.IMAGE_PNG;
            case "jpg", "jpeg" -> MediaType.IMAGE_JPEG;
            case "gif" -> MediaType.IMAGE_GIF;
            case "webp" -> MediaType.parseMediaType("image/webp");
            case "svg" -> MediaType.parseMediaType("image/svg+xml");
            case "pdf" -> MediaType.APPLICATION_PDF;
            case "txt", "log", "md", "csv" -> MediaType.TEXT_PLAIN;
            case "json" -> MediaType.APPLICATION_JSON;
            default -> null;
        };
    }

    private String safeFilename(String resourceFilename, String title, String fallback) {
        String candidate = StringUtils.hasText(resourceFilename) ? resourceFilename
                : (StringUtils.hasText(title) ? title : fallback);

        candidate = candidate.replaceAll("[\\r\\n\\\\/]+", "_").trim();
        if (!StringUtils.hasText(candidate)) candidate = fallback;

        return candidate;
    }


    private String contentDispositionInline(String filename) {
        String ascii = filename.replaceAll("[^\\x20-\\x7E]", "_");

        ContentDisposition cd = ContentDisposition.inline()
                .filename(ascii)
                .filename(filename, StandardCharsets.UTF_8)
                .build();

        return cd.toString();
    }

    private String contentDispositionAttachment(String filename) {
        // ASCII fallback (για filename="")
        String ascii = filename.replaceAll("[^\\x20-\\x7E]", "_");

        ContentDisposition cd = ContentDisposition.attachment()
                .filename(ascii) // filename="ascii..."
                .filename(filename, StandardCharsets.UTF_8) // filename*=UTF-8''...
                .build();

        return cd.toString();
    }

    private String asciiFallback(String filename) {
        if (filename == null) return "download";
        // replace non-ASCII chars with underscores
        String ascii = filename.replaceAll("[^\\x20-\\x7E]", "_");
        // avoid empty
        return ascii.isBlank() ? "download" : ascii;
    }


}
