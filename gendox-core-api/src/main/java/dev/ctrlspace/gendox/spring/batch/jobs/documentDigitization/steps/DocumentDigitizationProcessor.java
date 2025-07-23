package dev.ctrlspace.gendox.spring.batch.jobs.documentDigitization.steps;

import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.TaskNode;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.AnswerCreationDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.TaskAnswerBatchDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.TaskDocumentMetadataDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.services.DocumentService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TaskNodeService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TaskService;
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

    @Value("#{jobParameters['reGenerateExistingAnswers'] == 'true'}")
    private boolean reGenerateExistingAnswers;
    // package private for testing
    static final int MAX_QUESTIONS_PER_BUCKET = 10;
    static final int MAX_QUESTION_TOKENS_PER_BUCKET = 5_000;
    static final int MAX_TOKENS = 100_000;

    private TaskService taskService;
    private TaskNodeService taskNodeService;
    private DocumentService documentService;

    @Autowired
    public DocumentDigitizationProcessor(TaskService taskService,
                                         TaskNodeService taskNodeService,
                                         DocumentService documentService) {
        this.taskService = taskService;
        this.taskNodeService = taskNodeService;
        this.documentService = documentService;
    }




    @Override
    public TaskAnswerBatchDTO process(TaskDocumentMetadataDTO documentMetadata) throws Exception {

        logger.info("Processing document metadata: {}", documentMetadata);

        TaskAnswerBatchDTO batch = new TaskAnswerBatchDTO();

        List<AnswerCreationDTO> newAnswers = new ArrayList<>();
        List<TaskNode> answersToDelete = new ArrayList<>();

        String prompt = documentMetadata.getPrompt();
        String structure = documentMetadata.getStructure();
        TaskNode documentNode = taskNodeService.getTaskNodeById(documentMetadata.getTaskNodeId());
        if (documentNode.getDocumentId() != null) {
            DocumentInstance documentInstance = documentService.getDocumentInstanceById(documentNode.getDocumentId());
        }

        logger.info("Processing document node: {}, prompt: {}, structure: {}",
                    documentNode.getId(), prompt, structure);

        return batch;
    }
}
