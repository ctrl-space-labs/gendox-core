package dev.ctrlspace.gendox.spring.batch.jobs.documentDigitization.steps;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxRuntimeException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.TaskNodeCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.documents.DocPageToImageOptions;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.*;
import dev.ctrlspace.gendox.gendoxcoreapi.services.*;
import org.slf4j.Logger;
import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.batch.item.ItemProcessor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.task.TaskExecutor;
import org.springframework.stereotype.Component;

import java.nio.file.Path;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Component
@StepScope
public class DocumentDigitizationProcessor implements ItemProcessor<TaskDocumentMetadataDTO, TaskAnswerBatchDTO> {

    private static final Logger logger = org.slf4j.LoggerFactory.getLogger(DocumentDigitizationProcessor.class);
    private final DownloadService downloadService;
    private final ProjectService projectService;
    private final TaskExecutor asyncDigitizationLlmCompletionsExecutor;

    @Value("#{jobParameters['reGenerateExistingAnswers'] == 'true'}")
    private boolean reGenerateExistingAnswers;
    @Value("#{stepExecution.jobExecution.jobInstance.id}")
    private Long jobInstanceId;

    private final DocumentDigitizationService documentDigitizationService;

    private TaskService taskService;
    private TaskNodeService taskNodeService;

    private Project project;
    private Task task;

    @Autowired
    public DocumentDigitizationProcessor(TaskService taskService,
                                         TaskNodeService taskNodeService,
                                         ProjectService projectService,
                                         DownloadService downloadService,
                                         DocumentDigitizationService documentDigitizationService,
                                         TaskExecutor asyncDigitizationLlmCompletionsExecutor) {
        this.taskService = taskService;
        this.taskNodeService = taskNodeService;
        this.downloadService = downloadService;
        this.projectService = projectService;
        this.documentDigitizationService = documentDigitizationService;
        this.asyncDigitizationLlmCompletionsExecutor = asyncDigitizationLlmCompletionsExecutor;
    }


    @Override
    public TaskAnswerBatchDTO process(TaskDocumentMetadataDTO documentMetadata) throws Exception {

        String promptPreview = documentMetadata.getPrompt() == null || documentMetadata.getPrompt().length() <= 100
                ? documentMetadata.getPrompt()
                : documentMetadata.getPrompt().substring(0, 100) + "...";
        logger.info(
                "Processing document metadata: taskNodeId={}, prompt={}, pageFrom={}, pageTo={}, allPages={}",
                documentMetadata.getTaskNodeId(),
                promptPreview,
                documentMetadata.getPageFrom(),
                documentMetadata.getPageTo(),
                documentMetadata.getAllPages()
        );

        TaskAnswerBatchDTO batch = new TaskAnswerBatchDTO();

        TaskNode documentNode = documentMetadata.getTaskNode();
        if (documentNode.getDocumentId() == null) {
            return null;
        }

        // each job run for a single task and project
        if (task == null) {
            task = taskService.getTaskById(documentNode.getTaskId());
        }
        if (project == null) {
            project = projectService.getProjectById(task.getProjectId());
            // lazy load child collections
            project.getProjectAgent().getAiTools().size();
        }

        DocumentInstance documentInstance = documentMetadata.getDocumentInstance();


        TaskNodeCriteria existingAnswersCriteria = TaskNodeCriteria.builder()
                .taskId(documentNode.getTaskId())
                .nodeTypeNames(List.of("ANSWER"))
                .nodeValueNodeDocumentId(documentNode.getId())
                .pageFrom(documentMetadata.getPageFrom())
                .pageTo(documentMetadata.getPageTo())
                .build();

        // Single lightweight query: it's needed to know which pages already exist either way, and,
        // when regenerating, the same result (with node ids) is reused for batch.setAnswersToDelete().
        List<TaskNode> existingNodes = taskNodeService.getExistingAnswerNodesLite(existingAnswersCriteria);

        Set<Integer> existingPageNums = existingNodes.stream()
                .map(n -> n.getNodeValue().getOrder() - 1)
                .collect(Collectors.toSet());

        Integer totalPagesRaw = documentInstance.getNumberOfPages();
        int totalPages = (totalPagesRaw != null && totalPagesRaw > 0) ? totalPagesRaw : 1;

        int startPage = 0;
        int endPage = totalPages - 1;
        Integer pageFromParam = documentMetadata.getPageFrom();
        Integer pageToParam = documentMetadata.getPageTo();

        if (pageFromParam != null) {
            startPage = Math.max(0, pageFromParam - 1); // Convert from 1-based to 0-based
        }

        if (pageToParam != null) {
            endPage = Math.min(totalPages - 1, pageToParam - 1); // Convert from 1-based to 0-based
        }

        if (startPage > endPage) {
            logger.warn("Invalid page range: pageFrom {} is greater than pageTo {} for document {}",
                    startPage + 1, endPage + 1, documentInstance.getId());
            return null;
        }

        List<Integer> pagesToProcess;
        if (reGenerateExistingAnswers) {
            batch.setAnswersToDelete(existingNodes);
            pagesToProcess = IntStream.rangeClosed(startPage, endPage).boxed().toList();
        } else {
            pagesToProcess = IntStream.rangeClosed(startPage, endPage)
                    .filter(i -> !existingPageNums.contains(i))
                    .boxed()
                    .toList();

            if (pagesToProcess.isEmpty()) {
                logger.info("Nothing to generate for documentNode {}: all pages in range [{}, {}] already have answers.",
                        documentNode.getId(), startPage + 1, endPage + 1);
                return null; // ← early exit; no rendering done
            }
        }

        PageContent content = loadPageContent(documentInstance, pagesToProcess, task);

        String digitizationPrompt = DocumentDigitizationService.composeDigitizationPrompt(
                task.getTaskPrompt(),
                documentMetadata.getPrompt(),
                DocumentDigitizationService.DEFAULT_DIGITIZATION_PROMPT);

        int finalTotalPages = totalPages;
        List<CompletableFuture<AnswerCreationDTO>> completionFutures = pagesToProcess.stream()
                .map(pageIndex -> getCompletionAnswerFuture(
                        digitizationPrompt,
                        documentNode,
                        documentInstance,
                        pageIndex,
                        finalTotalPages,
                        content.images(),
                        content.texts(),
                        content.pageOffset()))
                .toList();


        List<AnswerCreationDTO> newAnswers = completionFutures.stream()
                .map(CompletableFuture::join)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        // Release large image data eagerly before the writer step to reduce heap pressure.
        content.images().clear();
        content.texts().clear();

        batch.setNewAnswers(newAnswers);

        logger.debug("Processing document node: {}, instance id: {}, prompt: {}",
                documentNode.getId(), documentInstance.getId(), promptPreview);

        return batch;
    }

    private record PageContent(List<String> images, List<String> texts, int pageOffset) {}

    /**
     * Loads page images and/or text for the given document, routing by file type.
     * Only the content types enabled on the task ({@link DocumentDigitizationService#shouldUsePrintedPage}
     * / {@link DocumentDigitizationService#shouldUsePageText}) are loaded.
     * The {@code pageOffset} in the returned record is the 0-based index of the first page in
     * {@code images}, used to map an absolute page index to its position in the image list.
     */
    private PageContent loadPageContent(DocumentInstance documentInstance,
                                        List<Integer> pagesToProcess,
                                        Task task) throws Exception {
        String ext = downloadService.getFileExtension(documentInstance.getRemoteUrl());
        boolean loadImages = DocumentDigitizationService.shouldUsePrintedPage(task);
        boolean loadTexts = DocumentDigitizationService.shouldUsePageText(task);

        if (downloadService.isPagedFormat(ext)) {
            Path tempFilePath = downloadService.downloadToTemp(
                    documentInstance.getRemoteUrl(), "digitization-instance-id-" + jobInstanceId);

            List<String> images = new ArrayList<>();
            if (loadImages) {
                DocPageToImageOptions printOptions = DocPageToImageOptions.builder()
                        .minSide(1024)
                        .pageFrom(Collections.min(pagesToProcess))
                        .pageTo(Collections.max(pagesToProcess))
                        .build();
                images.addAll(downloadService.printDocumentPages(
                        documentInstance.getRemoteUrl(), tempFilePath, printOptions));
            }

            List<String> texts = new ArrayList<>();
            if (loadTexts) {
                texts.addAll(downloadService.readDocumentPages(
                        documentInstance.getRemoteUrl(), tempFilePath));
            }

            int pageOffset = pagesToProcess.isEmpty() ? 0 : Collections.min(pagesToProcess);
            return new PageContent(images, texts, pageOffset);

        } else if (downloadService.isImageFile(ext)) {
            if (loadImages) {
                String singleImage = downloadService.readDocumentImageToBase64(documentInstance.getRemoteUrl());
                return new PageContent(new ArrayList<>(List.of(singleImage)), new ArrayList<>(), 0);
            }
            return new PageContent(new ArrayList<>(), new ArrayList<>(), 0);

        } else {
            List<String> texts = loadTexts
                    ? downloadService.readDocumentPages(documentInstance.getRemoteUrl())
                    : new ArrayList<>();
            return new PageContent(new ArrayList<>(), texts, 0);
        }
    }

    private CompletableFuture<AnswerCreationDTO> getCompletionAnswerFuture(String prompt,
                                                                           TaskNode documentNode,
                                                                           DocumentInstance documentInstance,
                                                                           int pageIndex,
                                                                           int totalPages,
                                                                           List<String> pageImages,
                                                                           List<String> pageTexts,
                                                                           int pageOffset) {
        return CompletableFuture.supplyAsync(() -> {
            String pageImage = null;
            if (!pageImages.isEmpty()) {
                // printDocumentPages returns only the requested slice [pageFrom..pageTo], so
                // subtract the slice offset to get the position within the returned list.
                int idx = pageIndex - pageOffset;
                pageImage = (idx >= 0 && idx < pageImages.size()) ? pageImages.get(idx) : null;
            }
            String pageText = null;
            if (!pageTexts.isEmpty()) {
                // readDocumentPages returns all pages, so pageIndex maps directly (clamped for safety).
                int idx = Math.min(pageIndex, pageTexts.size() - 1);
                pageText = pageTexts.get(idx);
            }

            String responseText;
            try {
                responseText = documentDigitizationService.digitizePage(
                        prompt,
                        documentInstance,
                        project,
                        task,
                        documentNode,
                        pageIndex,
                        totalPages,
                        pageText,
                        pageImage);
            } catch (Exception e) {
                throw new GendoxRuntimeException(
                        org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR,
                        "DIGITIZATION_FAILED",
                        "Failed to digitize page " + (pageIndex + 1) + ": " + e.getMessage(), e);
            }

            return AnswerCreationDTO.builder()
                    .documentNode(documentNode)
                    .newAnswer(TaskNodeDTO.builder()
                            .nodeType("ANSWER")
                            .taskId(task.getId())
                            .nodeValue(TaskNodeValueDTO.builder()
                                    .message(responseText)
                                    .order(pageIndex + 1)
                                    .nodeDocumentId(documentNode.getId())
                                    .build())
                            .documentId(documentNode.getDocumentId())
                            .build())
                    .build();
        }, asyncDigitizationLlmCompletionsExecutor)
        .handle((newPage, throwable) -> {
            if (throwable != null) {
                logger.error("Failed to get completion for docNode {}, page {}: ",
                        documentNode.getId(), pageIndex + 1, throwable);
                return null;
            }
            return newPage;
        });
    }
}
