package dev.ctrlspace.gendox.spring.batch.jobs.documentInsights.steps;


import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.knuddels.jtokkit.api.Encoding;
import com.knuddels.jtokkit.api.EncodingRegistry;
import com.knuddels.jtokkit.api.ModelType;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.MessageLocalContext;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.DocumentCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.*;
import dev.ctrlspace.gendox.gendoxcoreapi.services.*;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.TaskNodeTypeConstants;
import org.jetbrains.annotations.NotNull;
import org.jetbrains.annotations.Nullable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.util.json.schema.JsonSchemaGenerator;
import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.batch.item.ItemProcessor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.*;


@Component
@StepScope
public class DeleteInsightsAnswersProcessor implements ItemProcessor<TaskDocumentQuestionsDTO, TaskAnswerBatchDTO> {

    private static final Logger logger = LoggerFactory.getLogger(DeleteInsightsAnswersProcessor.class);

    @Value("#{jobParameters['reGenerateExistingAnswers'] == 'true'}")
    private Boolean reGenerateExistingAnswers;

    private final CompletionService completionService;
    private final ProjectService projectService;
    private final MessageService messageService;
    private final DocumentSectionService documentSectionService;
    private TypeService typeService;
    private TaskService taskService;
    private TaskNodeService taskNodeService;
    private ObjectMapper objectMapper;
    private EncodingRegistry encodingRegistry;
    private Project project;
    private final DocumentService documentService;

    @Autowired
    public DeleteInsightsAnswersProcessor(TypeService typeService,
                                          TaskService taskService,
                                          ObjectMapper objectMapper,
                                          EncodingRegistry encodingRegistry,
                                          CompletionService completionService,
                                          ProjectService projectService,
                                          MessageService messageService,
                                          DocumentSectionService documentSectionService,
                                          TaskNodeService taskNodeService,
                                          DocumentService documentService) {
        this.typeService = typeService;
        this.taskService = taskService;
        this.objectMapper = objectMapper;
        this.encodingRegistry = encodingRegistry;
        this.completionService = completionService;
        this.projectService = projectService;
        this.messageService = messageService;
        this.documentSectionService = documentSectionService;
        this.taskNodeService = taskNodeService;
        this.documentService = documentService;
    }

    @Override
    public TaskAnswerBatchDTO process(TaskDocumentQuestionsDTO documentGroupWithQuestions) throws Exception {

        if (!reGenerateExistingAnswers) {
            return null;
        }

        TaskAnswerBatchDTO batch = new TaskAnswerBatchDTO();

        List<TaskNode> existingAnswers = new ArrayList<>();

        taskNodeService.findAnswerNodesBatch(documentGroupWithQuestions.getDocumentNode().getTaskId(),
                        List.of(documentGroupWithQuestions.getDocumentNode().getId()),
                        documentGroupWithQuestions.getQuestionNodes().stream().map(TaskNode::getId).toList(),
                        Pageable.unpaged())
                .stream()
                .forEach(a -> {
                    existingAnswers.add(a);
                });


        batch.setAnswersToDelete(existingAnswers);


        return batch;
    }


}

