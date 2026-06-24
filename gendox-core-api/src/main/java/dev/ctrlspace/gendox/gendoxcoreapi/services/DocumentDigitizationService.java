package dev.ctrlspace.gendox.gendoxcoreapi.services;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxRuntimeException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.CompletionRuntimeOverridesDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ContentPart;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.documents.DocPageToImageOptions;
import jakarta.annotation.Nullable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.task.TaskExecutor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

/**
 * Encapsulates the per-page LLM digitization logic so it can be reused by
 * both the Digitization Spring Batch job and the Document Splitter.
 *
 * <p>Two public entry points:
 * <ul>
 *   <li>{@link #digitizePage} — one LLM call for one page; used by the Digitization job.</li>
 *   <li>{@link #digitizeDocumentToText} — iterates all pages and returns concatenated plain text;
 *       used by the Splitter when {@code projectAgent.autoDigitization = true}.</li>
 * </ul>
 */
@Service
public class DocumentDigitizationService {

    private static final Logger logger = LoggerFactory.getLogger(DocumentDigitizationService.class);

    /** Used when auto-digitization or digitization runs without task/document prompts. */
    public static final String DEFAULT_DIGITIZATION_PROMPT =
            "Extract and clean the text content in markdown format. This is just one page from a document, "
                    + "follow the context and keep the formating. In parallel each doc page is processed by separate LLM calls.";

    private final DownloadService downloadService;
    private final MessageService messageService;
    private final CompletionService completionService;
    private final TaskService taskService;
    private final ObjectMapper objectMapper;
    private final TaskExecutor asyncDigitizationLlmCompletionsExecutor;

    @Autowired
    public DocumentDigitizationService(DownloadService downloadService,
                                       MessageService messageService,
                                       CompletionService completionService,
                                       TaskService taskService,
                                       ObjectMapper objectMapper,
                                       @Qualifier("asyncDigitizationLlmCompletionsExecutor")
                                       TaskExecutor asyncDigitizationLlmCompletionsExecutor) {
        this.downloadService = downloadService;
        this.messageService = messageService;
        this.completionService = completionService;
        this.taskService = taskService;
        this.objectMapper = objectMapper;
        this.asyncDigitizationLlmCompletionsExecutor = asyncDigitizationLlmCompletionsExecutor;
    }

    /**
     * Builds the LLM prompt from task-level and per-document instructions.
     * Callers (digitization job, splitter) compose this before {@link #digitizePage}.
     */
    public static String composeDigitizationPrompt(@Nullable String taskPrompt,
                                                   @Nullable String documentPrompt,
                                                   String fallbackWhenEmpty) {
        StringBuilder sb = new StringBuilder();
        if (StringUtils.hasText(taskPrompt)) {
            sb.append(taskPrompt.trim());
        }
        if (StringUtils.hasText(documentPrompt)) {
            if (!sb.isEmpty()) {
                sb.append("\n\n");
            }
            sb.append(documentPrompt.trim());
        }
        return sb.isEmpty() ? fallbackWhenEmpty : sb.toString();
    }

    public static boolean shouldUsePrintedPage(@Nullable Task task) {
        return task == null
                || Boolean.TRUE.equals(task.getUsePrintedPage())
                || (task.getUsePrintedPage() == null && task.getUsePageText() == null);
    }

    public static boolean shouldUsePageText(@Nullable Task task) {
        return task != null && Boolean.TRUE.equals(task.getUsePageText());
    }

    /**
     * Runs one LLM call for a single document page.
     *
     * @param prompt           caller-built instructions (task + document prompts); page number is appended here
     * @param documentInstance the document being digitized
     * @param project          the owning project (agent must be eagerly loaded)
     * @param task             nullable — when non-null, structured-output schema and completion overrides apply
     * @param documentNode     nullable — the DOCUMENT TaskNode holding the output schema; required when task != null
     * @param pageIndex        0-based index of the page within the document
     * @param totalPages       total number of pages in the document
     * @param pageText         nullable text content extracted from the page
     * @param pageImageBase64  nullable Base64-encoded JPEG image of the rendered page
     * @return the raw string returned by the LLM
     */
    public String digitizePage(String prompt,
                               DocumentInstance documentInstance,
                               Project project,
                               @Nullable Task task,
                               @Nullable TaskNode documentNode,
                               int pageIndex,
                               int totalPages,
                               @Nullable String pageText,
                               @Nullable String pageImageBase64) throws GendoxException {

        ChatThread newThread = messageService.createThreadForMessage(
                List.of(project.getProjectAgent().getUserId()),
                project.getId(),
                "DOCUMENT_DIGITIZATION - doc:" + documentInstance.getId()
        );

        StringBuilder promptBuilder = new StringBuilder()
                .append(prompt).append("\n\n")
                .append("Document Page: ").append(pageIndex + 1).append(" out of ").append(totalPages);

        boolean sendImage = shouldUsePrintedPage(task) && pageImageBase64 != null;
        boolean sendText = shouldUsePageText(task) && pageText != null;

        if (sendText) {
            promptBuilder.append("\n\n")
                    .append("<page-text>\n")
                    .append(pageText)
                    .append("\n</page-text>");
        }

        Message message = new Message();
        message.setValue(promptBuilder.toString());
        message.setThreadId(newThread.getId());
        message.setProjectId(project.getId());
        message.setCreatedBy(project.getProjectAgent().getUserId());
        message.setUpdatedBy(project.getProjectAgent().getUserId());
        message = messageService.createMessage(message);

        if (sendImage) {
            message.setAdditionalResources(List.of(
                    ContentPart.builder()
                            .type("image_url")
                            .imageUrl(ContentPart.ImageInput.builder()
                                    .url(pageImageBase64)
                                    .build())
                            .build()
            ));
        }

        ObjectNode schema = null;
        if (task != null && documentNode != null) {
            String structureJson = documentNode.getNodeValue().getDocumentMetadata().getStructure();
            schema = buildDigitizationResponseSchema(structureJson);
        }

        CompletionRuntimeOverridesDTO overrides = task != null
                ? taskService.buildDefaultCompletionOverrides(task)
                : null;

        List<Message> response = completionService.getCompletion(message, new ArrayList<>(), project, schema, overrides);
        return response.getLast().getValue();
    }

    /**
     * Processes every page of a document in parallel (using the same
     * {@code asyncDigitizationLlmCompletionsExecutor} pool as the Digitization job) and
     * returns the page outputs concatenated in order as a plain-text string.
     * No structured output is requested (no Task or TaskNode).
     * Intended for use by the Splitter when {@code projectAgent.autoDigitization = true}.
     */
    public String digitizeDocumentToText(DocumentInstance documentInstance,
                                         Project project,
                                         String prompt) throws GendoxException, IOException {

        int totalPages = Optional.ofNullable(documentInstance.getNumberOfPages()).orElse(1);
        String ext = downloadService.getFileExtension(documentInstance.getRemoteUrl());

        final List<String> images;
        final List<String> texts;

        if (downloadService.isPagedFormat(ext)) {
            Path tempFile = downloadService.downloadToTemp(documentInstance.getRemoteUrl(), null);
            DocPageToImageOptions printOptions = DocPageToImageOptions.builder()
                    .minSide(1024)
                    .pageFrom(0)
                    .pageTo(totalPages - 1)
                    .build();
            images = downloadService.printDocumentPages(documentInstance.getRemoteUrl(), tempFile, printOptions);
            texts  = downloadService.readDocumentPages(documentInstance.getRemoteUrl(), tempFile);

        } else if (downloadService.isImageFile(ext)) {
            images = List.of(downloadService.readDocumentImageToBase64(documentInstance.getRemoteUrl()));
            texts  = List.of();
            totalPages = 1;

        } else {
            images = List.of();
            texts  = downloadService.readDocumentPages(documentInstance.getRemoteUrl());
            totalPages = texts.size();
        }

        final int finalTotalPages = totalPages;

        // Submit all pages to the shared LLM executor pool — same pattern as the Digitization job
        List<CompletableFuture<String>> futures = IntStream.range(0, finalTotalPages)
                .mapToObj(i -> {
                    String pageImage = (!images.isEmpty() && i < images.size()) ? images.get(i) : null;
                    String pageText  = (!texts.isEmpty()  && i < texts.size())  ? texts.get(i)  : null;
                    return CompletableFuture.supplyAsync(() -> {
                        try {
                            return digitizePage(prompt, documentInstance, project, null, null,
                                    i, finalTotalPages, pageText, pageImage);
                        } catch (GendoxException e) {
                            throw new GendoxRuntimeException(e.getHttpStatus(), e.getErrorCode(), e.getMessage(), e);
                        }
                    }, asyncDigitizationLlmCompletionsExecutor)
                    .handle((result, throwable) -> {
                        if (throwable != null) {
                            logger.error("digitizeDocumentToText failed on page {} of doc {}: ",
                                    i + 1, documentInstance.getId(), throwable);
                            return null;
                        }
                        return result;
                    });
                })
                .collect(Collectors.toList());

        // Join in page order so the concatenated text is correctly sequenced
        return futures.stream()
                .map(CompletableFuture::join)
                .filter(Objects::nonNull)
                .collect(Collectors.joining("\n\n"));
    }

    /**
     * Wraps a raw JSON-Schema string into the {@code {"name":…, "schema":…}} envelope
     * expected by the LLM adapter layer for structured output.
     * Returns null when {@code structureJson} is blank.
     */
    public ObjectNode buildDigitizationResponseSchema(@Nullable String structureJson)
            throws GendoxException {
        if (!StringUtils.hasText(structureJson)) return null;
        try {
            ObjectNode wrapper = objectMapper.createObjectNode();
            wrapper.put("name", "json_response_with_actions");
            wrapper.set("schema", objectMapper.readTree(structureJson));
            return wrapper;
        } catch (JsonProcessingException e) {
            throw new GendoxException("ERROR_BUILDING_DIGITIZATION_SCHEMA",
                    "Failed to parse digitization response schema: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR, e);
        }
    }
}
