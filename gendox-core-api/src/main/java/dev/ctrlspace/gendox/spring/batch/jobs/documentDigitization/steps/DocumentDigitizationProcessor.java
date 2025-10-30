package dev.ctrlspace.gendox.spring.batch.jobs.documentDigitization.steps;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxRuntimeException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ContentPart;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Component
@StepScope
public class DocumentDigitizationProcessor implements ItemProcessor<TaskDocumentMetadataDTO, TaskAnswerBatchDTO> {

    private static final Logger logger = org.slf4j.LoggerFactory.getLogger(DocumentDigitizationProcessor.class);
    private final DownloadService downloadService;
    private final MessageService messageService;
    private final CompletionService completionService;
    private final ProjectService projectService;
    private final TaskExecutor asyncLlmCompletionsExecutor;

    @Value("#{jobParameters['reGenerateExistingAnswers'] == 'true'}")
    private boolean reGenerateExistingAnswers;


    private TaskService taskService;
    private TaskNodeService taskNodeService;
    private DocumentService documentService;

    private Project project;
    private Task task;

    @Autowired
    public DocumentDigitizationProcessor(TaskService taskService,
                                         TaskNodeService taskNodeService,
                                         CompletionService completionService,
                                         ProjectService projectService,
                                         DocumentService documentService,
                                         DownloadService downloadService,
                                         MessageService messageService,
                                         TaskExecutor asyncLlmCompletionsExecutor) {
        this.taskService = taskService;
        this.taskNodeService = taskNodeService;
        this.documentService = documentService;
        this.downloadService = downloadService;
        this.completionService = completionService;
        this.projectService = projectService;
        this.messageService = messageService;
        this.asyncLlmCompletionsExecutor = asyncLlmCompletionsExecutor;
    }


    @Override
    public TaskAnswerBatchDTO process(TaskDocumentMetadataDTO documentMetadata) throws Exception {

        logger.info("Processing document metadata: {}", documentMetadata);

        TaskAnswerBatchDTO batch = new TaskAnswerBatchDTO();

        TaskNode documentNode = taskNodeService.getTaskNodeById(documentMetadata.getTaskNodeId());
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

        DocumentInstance documentInstance = documentService.getDocumentInstanceById(documentNode.getDocumentId());


        TaskNodeCriteria existingAnswersCriteria = TaskNodeCriteria.builder()
                .taskId(documentNode.getTaskId())
                .nodeTypeNames(List.of("ANSWER"))
                .nodeValueNodeDocumentId(documentNode.getId())
                .build();
        Page<TaskNode> existingNodes = taskNodeService.getTaskNodesByCriteria(existingAnswersCriteria, Pageable.unpaged());


        Set<Integer> existingPageNums = existingNodes.getContent().stream()
                .map(n -> n.getNodeValue().getOrder() - 1)
                .collect(Collectors.toSet());


        Integer totalPages = documentInstance.getNumberOfPages();
        if (totalPages == null || totalPages <= 0) {
            logger.warn("Document instance {} has no totalPages, skipping.", documentInstance.getId());
            return null;
        }

        // Determine page range to process
        int startPage = 0; // 0-based indexing for internal processing
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
            batch.setAnswersToDelete(existingNodes.getContent());
            pagesToProcess = IntStream.rangeClosed(startPage, endPage).boxed().toList();
        } else {
            pagesToProcess = IntStream.rangeClosed(startPage, endPage)
                    .filter(i -> !existingPageNums.contains(i))
                    .boxed()
                    .collect(Collectors.toList());

            if (pagesToProcess.isEmpty()) {
                logger.info("Nothing to generate for documentNode {}: all pages in range [{}, {}] already have answers.",
                        documentNode.getId(), startPage + 1, endPage + 1);
                return null; // ← early exit; no rendering done
            }
        }

        String prompt = documentMetadata.getPrompt();
        String structure = documentMetadata.getStructure();
        DocPageToImageOptions printOptions = DocPageToImageOptions.builder().build();
        // increase print quality, this doubles the input tokens, compare to the default 768
        printOptions.setMinSide(1024);
        printOptions.setPageFrom(Collections.min(pagesToProcess));
        printOptions.setPageTo(Collections.max(pagesToProcess));

        // TODO change this to optionally get a list of page numbers to print
        List<String> printedPagesBase64 = downloadService.printDocumentPages(documentInstance.getRemoteUrl(), printOptions);
        
        // Validate that we have enough pages and create safe mapping
        Map<Integer, String> pageImages = pagesToProcess.stream()
                .collect(Collectors.toMap(i -> i, i -> printedPagesBase64.get(i - printOptions.getPageFrom())));

        // CORE PROCESSING:
        // There are 2 thread pools: 1 for the docs, 1 for the LLM completions
        // This runs 10 files in parallel, then these 10 files are competing against each other for LLM completions
        // 1. When there are multiple files, they progress all together, 2. When there is a single file, it will run all the pages in parallel
        List<CompletableFuture<AnswerCreationDTO>> completionFutures = pagesToProcess.stream()
                .map(pageNumber -> getCompletionAnswerFuture(prompt, pageImages.get(pageNumber), totalPages, documentNode, pageNumber))
                .toList();


        List<AnswerCreationDTO> newAnswers = completionFutures.stream()
                .map(CompletableFuture::join)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());


        batch.setNewAnswers(newAnswers);

        logger.info("Processing document node: {}, instance id: {}, prompt: {}, structure: {}",
                documentNode.getId(), documentInstance.getId(), prompt, structure);
        logger.debug("Processing prompt: {}, structure: {}",
                prompt, structure);


        return batch;
    }

    private CompletableFuture<AnswerCreationDTO> getCompletionAnswerFuture(String prompt, String pageImageBase64, int totalPages, TaskNode documentNode, int pageIndex) {
        return CompletableFuture.supplyAsync(() -> {
                    ChatThread newThread = messageService.createThreadForMessage(
                            List.of(project.getProjectAgent().getUserId()),
                            project.getId(),
                            "DOCUMENT_DIGITIZATION - Task:" + task.getId()
                    );

                    StringBuilder promptBuilder = new StringBuilder()
                            .append(prompt).append("\n\n")
                            .append("Document Page: ").append(pageIndex + 1).append(" out of ").append(totalPages).append("\n\n");

                    Message message = new Message();
                    message.setValue(promptBuilder.toString());
                    message.setThreadId(newThread.getId());
                    message.setProjectId(project.getId());
                    message.setCreatedBy(project.getProjectAgent().getUserId());
                    message.setUpdatedBy(project.getProjectAgent().getUserId());
                    message = messageService.createMessage(message);

                    message.setAdditionalResources(List.of(
                            ContentPart.builder()
                                    .type("image_url")
                                    .imageUrl(ContentPart.ImageInput.builder()
                                            .url(pageImageBase64)
                                            .build())
                                    .build()
                    ));

                    List<Message> response;
                    try {
                        response = completionService.getCompletion(message, new ArrayList<>(), project, null);
                    } catch (GendoxException e) {
                        throw new GendoxRuntimeException(e.getHttpStatus(), e.getErrorCode(), e.getMessage(), e);
                    }

                    return AnswerCreationDTO.builder()
                            .documentNode(documentNode)
                            .newAnswer(TaskNodeDTO.builder()
                                    .nodeType("ANSWER")
                                    .taskId(task.getId())
                                    .nodeValue(TaskNodeValueDTO.builder()
                                            .message(response.getLast().getValue())
                                            .order(pageIndex + 1)
                                            .nodeDocumentId(documentNode.getId())
                                            .build())
                                    .documentId(documentNode.getDocumentId())
                                    .build())
                            .build();
                }, asyncLlmCompletionsExecutor)
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
