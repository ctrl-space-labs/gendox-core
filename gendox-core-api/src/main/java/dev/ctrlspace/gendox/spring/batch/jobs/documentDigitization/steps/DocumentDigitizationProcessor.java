package dev.ctrlspace.gendox.spring.batch.jobs.documentDigitization.steps;

import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ContentPart;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.documents.DocPageToImageOptions;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.AnswerCreationDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.TaskAnswerBatchDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.TaskDocumentMetadataDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.services.*;
import org.slf4j.Logger;
import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.batch.item.ItemProcessor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@StepScope
public class DocumentDigitizationProcessor implements ItemProcessor<TaskDocumentMetadataDTO, TaskAnswerBatchDTO> {

    private static final Logger logger = org.slf4j.LoggerFactory.getLogger(DocumentDigitizationProcessor.class);
    private final DownloadService downloadService;
    private final MessageService messageService;
    private final CompletionService completionService;
    private final ProjectService projectService;

    @Value("#{jobParameters['reGenerateExistingAnswers'] == 'true'}")
    private boolean reGenerateExistingAnswers;
    // package private for testing
    static final int MAX_QUESTIONS_PER_BUCKET = 10;
    static final int MAX_QUESTION_TOKENS_PER_BUCKET = 5_000;
    static final int MAX_TOKENS = 100_000;

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
                                         DocumentService documentService, DownloadService downloadService, MessageService messageService) {
        this.taskService = taskService;
        this.taskNodeService = taskNodeService;
        this.documentService = documentService;
        this.downloadService = downloadService;
        this.completionService = completionService;
        this.projectService = projectService;
        this.messageService = messageService;
    }




    @Override
    public TaskAnswerBatchDTO process(TaskDocumentMetadataDTO documentMetadata) throws Exception {

        logger.info("Processing document metadata: {}", documentMetadata);

        TaskAnswerBatchDTO batch = new TaskAnswerBatchDTO();

        TaskNode documentNode = taskNodeService.getTaskNodeById(documentMetadata.getTaskNodeId());
        if (documentNode.getDocumentId() == null) {
            return null;
        }

        DocumentInstance documentInstance = documentService.getDocumentInstanceById(documentNode.getDocumentId());

        // each job run for a single task and project
        if (task == null) {
            task = taskService.getTaskById(documentNode.getTaskId());
        }
        if (project == null){
            project = projectService.getProjectById(task.getProjectId());
        }

        List<AnswerCreationDTO> newAnswers = new ArrayList<>();
        List<TaskNode> answersToDelete = new ArrayList<>();

        String prompt = documentMetadata.getPrompt();
        String structure = documentMetadata.getStructure();
        DocPageToImageOptions printOptions = DocPageToImageOptions.builder().build();
        // this doubles the input tokens, compaire to the default 768
        // as of 2025-07-26 Gemini has a bug and doesnt calculate the tokens correctly 2.0 -> 1800 tokens, 2.5 -> charges 256 tokens

        // increase print quality
        printOptions.setMinSide(1024);
        List<String> printedPagesBase64 = downloadService.printDocumentPages(documentInstance.getRemoteUrl(), printOptions);

        for (int i = 0 ; i < printedPagesBase64.size(); i++) {
            String pageImage = printedPagesBase64.get(i);

            ChatThread newThread = messageService.createThreadForMessage(List.of(project.getProjectAgent().getUserId()),
                    project.getId(),
                    "DOCUMENT_DIGITIZATION - Task:" + task.getId());
            StringBuilder promptBuilder = new StringBuilder();
            promptBuilder.append(prompt);
            promptBuilder.append("\n\n");
            promptBuilder.append("Document Page: ").append(i).append(" out of ").append(printedPagesBase64.size()).append("\n\n");


            Message message = new Message();
            message.setValue(promptBuilder.toString());
            message.setThreadId(newThread.getId());
            message.setProjectId(project.getId());
            message.setCreatedBy(project.getProjectAgent().getUserId());
            message.setUpdatedBy(project.getProjectAgent().getUserId());
            message = messageService.createMessage(message);

            // TODO save additional resources,
            //  set additional resource after the save, as it is not stored yet in the DB
            message.setAdditionalResources(List.of(
                    ContentPart.builder()
                            .type("image_url")
                            .imageUrl(ContentPart.ImageInput.builder()
                                    .url(pageImage)
                                    .build())
                            .build()));

            List<Message> response = completionService.getCompletion(message, new ArrayList<>(), project, null);

            int x = 5;

        }


        logger.info("Processing document node: {}, prompt: {}, structure: {}",
                    documentNode.getId(), prompt, structure);



        return batch;
    }
}
