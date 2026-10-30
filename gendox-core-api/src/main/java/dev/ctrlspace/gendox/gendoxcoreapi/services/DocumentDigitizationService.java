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
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.documents.PageText;
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
import java.util.Set;
import java.util.UUID;
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

    /**
     * System prompt for every digitization call. The project agent's own behavior is a chat persona,
     * so sending it here made the model answer as the chat agent instead of transcribing the page.
     */
    public static final String DIGITIZATION_SYSTEM_PROMPT =
            "You are a document digitization engine. Each request holds one page of a larger document, "
                    + "as an image of the page and/or the text extracted from it. "
                    + "Follow the user's instructions to extract the page content. Unless they say otherwise, "
                    + "transcribe the page faithfully into clean Markdown: keep the reading order, headings, lists and tables "
                    + "(as Markdown tables), and keep the original language, numbers, dates, codes and amounts exactly as written. "
                    + "Text in <page-text> is the page's own digital text and is exact: take every word, number and code "
                    + "from it character for character, and use the image for the layout, tables and reading order, "
                    + "and for anything the text lacks, such as text inside pictures, stamps or handwriting. "
                    + "Text in <page-ocr-text> was machine-read and may be incomplete or wrong: the image decides, "
                    + "and that text only helps to read it. "
                    + "Do not summarize, translate, explain or add commentary. "
                    + "Mark text you cannot read as [illegible]. If the page is blank, return an empty response.";

    /**
     * Output budget for an auto-digitized page. The agent's max tokens is sized for chat answers (500 by default)
     * and cut dense pages short; this is a cap, not what a page costs.
     */
    public static final long DIGITIZATION_MAX_TOKENS = 6000L;

    /**
     * Transcribing a page needs little thinking: at medium effort two thirds of the output were reasoning.
     * Models that think less than this by default are left at their default.
     */
    public static final String DIGITIZATION_REASONING_EFFORT = "low";

    /** Below this many visible characters a page is treated as a scan, even if some of its text is real. */
    public static final int MIN_TEXT_LAYER_CHARACTERS = 200;

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
     * Whether the page has its own digital text, which is then exact, rather than being a scan. A scan's
     * invisible OCR layer does not count, nor do fonts without a Unicode mapping, whose text only looks present.
     */
    public static boolean hasTextLayer(PageText page) {
        if (page.visibleCharacters() < MIN_TEXT_LAYER_CHARACTERS) {
            return false;
        }
        long unreadable = page.text().codePoints()
                .filter(c -> c == 0xFFFD || Character.getType(c) == Character.PRIVATE_USE)
                .count();
        return unreadable * 20 < page.visibleCharacters();
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

        boolean sendImage = shouldUsePrintedPage(task) && pageImageBase64 != null;
        boolean sendText = shouldUsePageText(task) && pageText != null;

        Message message = createPageMessage(prompt, documentInstance, project.getId(), project.getProjectAgent().getUserId(),
                pageIndex, totalPages, sendText ? pageText : null, "page-text", sendImage ? pageImageBase64 : null);

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
     * One page of auto-digitization: its image, and its text when it has any.
     *
     * @param overrides       from {@link #buildAutoDigitizationOverrides}
     * @param pageTextIsExact true for the page's own digital text, false for text machine-read from a scan
     */
    private String digitizePageToText(String prompt,
                                      DocumentInstance documentInstance,
                                      CompletionRuntimeOverridesDTO overrides,
                                      int pageIndex,
                                      int totalPages,
                                      @Nullable String pageText,
                                      boolean pageTextIsExact,
                                      @Nullable String pageImageBase64) throws GendoxException {

        Message message = createPageMessage(prompt, documentInstance, overrides.getProjectId(), overrides.getCreatedByAgentUserId(),
                pageIndex, totalPages, StringUtils.hasText(pageText) ? pageText : null,
                pageTextIsExact ? "page-text" : "page-ocr-text", pageImageBase64);

        // No project is passed, so the agent's chat template, tools and moderation stay out of the request
        List<Message> response = completionService.getCompletion(message, new ArrayList<>(), null, null, overrides);
        return response.getLast().getValue();
    }

    /**
     * Saves the page's prompt in a new thread, with the page text wrapped in {@code <pageTextTag>} and the page image
     * attached, each when not null.
     */
    private Message createPageMessage(String prompt,
                                      DocumentInstance documentInstance,
                                      UUID projectId,
                                      UUID agentUserId,
                                      int pageIndex,
                                      int totalPages,
                                      @Nullable String pageText,
                                      String pageTextTag,
                                      @Nullable String pageImageBase64) throws GendoxException {

        ChatThread newThread = messageService.createThreadForMessage(
                List.of(agentUserId),
                projectId,
                "DOCUMENT_DIGITIZATION - doc:" + documentInstance.getId()
        );

        StringBuilder promptBuilder = new StringBuilder()
                .append(prompt).append("\n\n")
                .append("Document Page: ").append(pageIndex + 1).append(" out of ").append(totalPages);

        if (pageText != null) {
            promptBuilder.append("\n\n")
                    .append("<").append(pageTextTag).append(">\n")
                    .append(pageText)
                    .append("\n</").append(pageTextTag).append(">");
        }

        Message message = new Message();
        message.setValue(promptBuilder.toString());
        message.setThreadId(newThread.getId());
        message.setProjectId(projectId);
        message.setCreatedBy(agentUserId);
        message.setUpdatedBy(agentUserId);
        message = messageService.createMessage(message);

        if (pageImageBase64 != null) {
            message.setAdditionalResources(List.of(
                    ContentPart.builder()
                            .type("image_url")
                            .imageUrl(ContentPart.ImageInput.builder()
                                    .url(pageImageBase64)
                                    .build())
                            .build()
            ));
        }
        return message;
    }

    /**
     * Runtime values for an auto-digitization call: the project agent's model settings,
     * with {@link #DIGITIZATION_SYSTEM_PROMPT}, {@link #DIGITIZATION_MAX_TOKENS} and
     * {@link #DIGITIZATION_REASONING_EFFORT}.
     * <p>
     * Call it once, on the thread that loaded {@code project}, and share the result with the page threads.
     * The entities belong to that thread's Hibernate session, and lazy loading them from several page threads
     * at once fails with "Illegal pop() with non-matching JdbcValuesSourceProcessingState".
     */
    private CompletionRuntimeOverridesDTO buildAutoDigitizationOverrides(Project project) {
        ProjectAgent agent = project.getProjectAgent();
        AiModel model = agent.getCompletionModel();

        CompletionRuntimeOverridesDTO overrides = new CompletionRuntimeOverridesDTO();
        overrides.setSystemPrompt(DIGITIZATION_SYSTEM_PROMPT);
        overrides.setProjectId(project.getId());
        overrides.setOrganizationId(project.getOrganizationId());
        overrides.setCreatedByAgentUserId(agent.getUserId());
        overrides.setCompletionModelName(model.getName());
        if (thinksMoreThanDigitizationNeeds(model)) {
            overrides.setReasoningEffort(DIGITIZATION_REASONING_EFFORT);
        }
        overrides.setMaxTokens(DIGITIZATION_MAX_TOKENS);
        overrides.setTemperature(agent.getTemperature());
        overrides.setTopP(agent.getTopP());
        return overrides;
    }

    /** The effort is only ever lowered: a model that does not think by default is left that way. */
    static boolean thinksMoreThanDigitizationNeeds(AiModel model) {
        String effort = model.getDefaultReasoningEffort();
        return Boolean.TRUE.equals(model.getSupportsReasoning())
                && effort != null
                && !Set.of("none", "minimal", "low").contains(effort);
    }

    /**
     * Processes every page of a document in parallel (using the same
     * {@code asyncDigitizationLlmCompletionsExecutor} pool as the Digitization job) and
     * returns the page outputs concatenated in order as a plain-text string.
     * No structured output is requested (no Task or TaskNode).
     * Intended for use by the Splitter when {@code projectAgent.autoDigitization = true}.
     *
     * @param file the document downloaded for this run; the caller deletes it
     */
    public String digitizeDocumentToText(DocumentInstance documentInstance,
                                         Project project,
                                         String prompt,
                                         Path file) throws GendoxException, IOException {

        int totalPages = Optional.ofNullable(documentInstance.getNumberOfPages()).orElse(1);
        String ext = downloadService.getFileExtension(documentInstance.getRemoteUrl());

        final List<String> images;
        final List<String> texts;
        // pages whose text is their own, exact, rather than read from a scan
        final Set<Integer> textLayerPages;

        if (downloadService.isPagedFormat(ext)) {
            List<PageText> pageTexts = downloadService.readDocumentPageTexts(documentInstance.getRemoteUrl(), file);
            texts = pageTexts.stream().map(PageText::text).toList();
            textLayerPages = IntStream.range(0, pageTexts.size())
                    .filter(i -> hasTextLayer(pageTexts.get(i)))
                    .boxed()
                    .collect(Collectors.toSet());
            logger.debug("Doc {}: {} of {} pages have a text layer", documentInstance.getId(), textLayerPages.size(), texts.size());
            // the same print options as the Digitization task (DocumentDigitizationProcessor), at a lower resolution
            DocPageToImageOptions printOptions = DocPageToImageOptions.builder()
                    .minSide(1024)
                    .imageSharpen(0f)
                    .pageFrom(0)
                    .pageTo(totalPages - 1)
                    .build();
            images = downloadService.printDocumentPages(documentInstance.getRemoteUrl(), file, printOptions);

        } else if (downloadService.isImageFile(ext)) {
            images = List.of(downloadService.readDocumentImageToBase64(documentInstance.getRemoteUrl(), file));
            texts  = List.of();
            textLayerPages = Set.of();
            totalPages = 1;

        } else {
            images = List.of();
            texts  = downloadService.readDocumentPages(documentInstance.getRemoteUrl(), file);
            textLayerPages = IntStream.range(0, texts.size()).boxed().collect(Collectors.toSet());
            totalPages = texts.size();
        }

        final int finalTotalPages = totalPages;
        CompletionRuntimeOverridesDTO overrides = buildAutoDigitizationOverrides(project);

        // Submit all pages to the shared LLM executor pool — same pattern as the Digitization job
        List<CompletableFuture<String>> futures = IntStream.range(0, finalTotalPages)
                .mapToObj(i -> {
                    String pageImage = (!images.isEmpty() && i < images.size()) ? images.get(i) : null;
                    String pageText  = (!texts.isEmpty()  && i < texts.size())  ? texts.get(i)  : null;
                    return CompletableFuture.supplyAsync(() -> {
                        try {
                            return digitizePageToText(prompt, documentInstance, overrides,
                                    i, finalTotalPages, pageText, textLayerPages.contains(i), pageImage);
                        } catch (GendoxException e) {
                            throw new GendoxRuntimeException(e.getHttpStatus(), e.getErrorCode(), e.getMessage(), e);
                        }
                    }, asyncDigitizationLlmCompletionsExecutor)
                    .handle((result, throwable) -> {
                        if (throwable != null) {
                            // keep the page's extracted text, if any, rather than lose the page
                            logger.error("digitizeDocumentToText failed on page {} of doc {}: ",
                                    i + 1, documentInstance.getId(), throwable);
                            return pageText;
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
