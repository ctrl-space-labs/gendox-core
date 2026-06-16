package dev.ctrlspace.gendox.spring.batch.jobs.documentInsights.steps;


import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.knuddels.jtokkit.api.EncodingRegistry;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.CompletionRuntimeOverridesDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.TaskNodeCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.*;
import dev.ctrlspace.gendox.gendoxcoreapi.services.*;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.TaskNodeTypeConstants;
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
public class InsightsSummaryProcessor implements ItemProcessor<TaskDocumentQuestionsDTO, InsightDocumentAnswersWithSummaryDTO> {

    private static final Logger logger = LoggerFactory.getLogger(InsightsSummaryProcessor.class);

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
    private Task task;
    private final DocumentService documentService;

    @Autowired
    public InsightsSummaryProcessor(TypeService typeService,
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
    public InsightDocumentAnswersWithSummaryDTO process(TaskDocumentQuestionsDTO documentGroupWithQuestions) throws Exception {

        // if already has summary and not reGenerateExistingAnswers, skip
        // the summaries are deleted in the Writer before this step runs
        if (documentGroupWithQuestions.getDocumentNode().getNodeValue().getDocumentMetadata() != null &&
                documentGroupWithQuestions.getDocumentNode().getNodeValue().getDocumentMetadata().getInsightsSummary() != null) {
            logger.trace("DocumentId: {} already has an insights summary, skipping.",
                    documentGroupWithQuestions.getDocumentNode().getId());
            return null;
        }

        Type answerNodeType = typeService.getTaskNodeTypeByName(TaskNodeTypeConstants.ANSWER);
        if (task == null) {

            task = taskService.getTaskById(documentGroupWithQuestions.getTaskId());
        }
        if (project == null) {
            project = projectService.getProjectById(task.getProjectId());
        }


        // each document should pass only one from the processor, if not, then multiple summaries will be created
        CompletionRuntimeOverridesDTO overrides = taskService.buildDefaultCompletionOverrides(task);
        CompletionAnswerSummary answerSummary = getDocumentAnswerSummary(documentGroupWithQuestions, task, project, overrides);
        if (answerSummary == null) {
            return null;
        }


        InsightDocumentAnswersWithSummaryDTO documentAnswersWithSummary = InsightDocumentAnswersWithSummaryDTO.builder()
                .documentNode(documentGroupWithQuestions.getDocumentNode())
                .answerSummary(answerSummary)
                .build();

        return documentAnswersWithSummary;
    }


    private static ObjectNode buildResponseSchema(ParameterizedTypeReference typeReference) throws JsonProcessingException {
        String raw = JsonSchemaGenerator.generateForType(typeReference.getType());
        ObjectMapper mapper = new ObjectMapper();
        JsonNode schemaNode = mapper.readTree(raw);
        ObjectNode wrapper = mapper.createObjectNode();
        wrapper.put("name", "json_response_with_actions");
        wrapper.set("schema", schemaNode);
        return wrapper;
    }


    private CompletionAnswerSummary getDocumentAnswerSummary(TaskDocumentQuestionsDTO documentGroupWithQuestions, Task task, Project project, CompletionRuntimeOverridesDTO overrides) {
        TaskNodeCriteria allAnswersForDocumentCriteria = TaskNodeCriteria.builder()
                .taskId(documentGroupWithQuestions.getTaskId())
                .nodeTypeNames(List.of("ANSWER"))
                .nodeValueNodeDocumentId(documentGroupWithQuestions.getDocumentNode().getId())
                .build();

        Page<TaskNode> allAnswerNodes = taskNodeService.getTaskNodesByCriteria(allAnswersForDocumentCriteria, Pageable.unpaged());


        if (allAnswerNodes.isEmpty()) {
            logger.debug("No answers found for documentId: {}, skipping summary generation.",
                    documentGroupWithQuestions.getDocumentNode().getDocumentId());
            return null;
        }

        Map<UUID, TaskNode> answersByQuestionId = allAnswerNodes.stream()
                .collect(HashMap::new,
                        (map, answerNode) -> map.put(answerNode.getNodeValue().getNodeQuestionId(), answerNode),
                        HashMap::putAll);

        StringBuilder qSB = new StringBuilder();
        qSB.append("""
                Here is a list of questions and their existing answers. These are presented in the UI in a list.
                There are too many for a human to read them separately. 
                In each answer you will find in the end a list with issues. You need to consolidate them into a single list.
                You must keep and consolidate all the issues described in the list in each answer.
                Try to order them from the most critical to the least, and if possible, group similar issues together.
                """);
        qSB.append("\n\n");
        if (task.getTaskPrompt() != null && !task.getTaskPrompt().isBlank()) {
            qSB.append("General Task Instructions: \n");
            qSB.append(task.getTaskPrompt()).append("\n\n");
        }
        if (Optional.ofNullable(documentGroupWithQuestions.getDocumentNode())
                .map(n -> n.getNodeValue())
                .map(v -> v.getDocumentMetadata())
                .map(m -> m.getPrompt())
                .filter(StringUtils::hasText)
                .isPresent()) {
            qSB.append("Instructions, and information given for this specific document \n");
            qSB.append(documentGroupWithQuestions.getDocumentNode().getNodeValue().getDocumentMetadata().getPrompt()).append("\n");
        }
        qSB.append("\n\n");
        qSB.append("Here are the questions to consolidate in a singe answer:\n");
        qSB.append("<all-questions-and-answers>\n");
        documentGroupWithQuestions.getQuestionNodes()
                .forEach(questionNode -> {
                    TaskNode answerNode = answersByQuestionId.get(questionNode.getId());
                    if (answerNode == null) {
                        return;
                    }

                    qSB.append("<question-answer>\n");
                    qSB.append("Question ID: ").append(questionNode.getId()).append("\n");
                    qSB.append("Question: ").append(questionNode.getNodeValue().getMessage()).append("\n");
                    qSB.append("Answer Flag: ").append(answerNode.getNodeValue().getAnswerFlagEnum()).append("\n");
                    qSB.append("Answer Value: ").append(answerNode.getNodeValue().getAnswerValue()).append("\n");
                    qSB.append("Answer: ").append(answerNode.getNodeValue().getMessage()).append("\n");
                    qSB.append("</question-answer>\n\n");


                });
        qSB.append("</all-questions-and-answers>\n");
        // issue table
        // Severity	Location (Article/Page)	Pass/Fail	Description of Finding	Comments & Action Required
        qSB.append("""
        
        
        Unless otherwise stated in the instructions above, the 'Answer Flag' of the answer should be the most severe flag among the consolidated answers.\n
        
        Consolidate the issues described in the above question-answers into a single list.
        You must keep and consolidate all the issues described in the list in each answer.
        Try to order them from the most critical to the least, and if possible, group similar issues together.
        
        Your answer must be a markdown table with these columns:
        | Severity | Location | Pass/Fail | Description of Finding | Comments & Action Required |
        | --- | --- | --- | --- | --- |
        
        
        """);


        //Dont need to delete previous DOCUMENT_INSIGHT_SUMMARY, they have been deleted in the Writer of the previous step

        ChatThread newThread = messageService.createThreadForMessage(List.of(project.getProjectAgent().getUserId()),
                project.getId(),
                "DOCUMENT_INSIGHTS - Question Summarizer:" + task.getId());


        Message message = new Message();
        message.setValue(qSB.toString());
        message.setThreadId(newThread.getId());
        message.setProjectId(project.getId());
        message.setCreatedBy(project.getProjectAgent().getUserId());
        message.setUpdatedBy(project.getProjectAgent().getUserId());
        message = messageService.createMessage(message);

        CompletionAnswerSummary completionQuestionResponse = getCompletionSummary(message, project, documentGroupWithQuestions.getDocumentNode(), overrides);
        return completionQuestionResponse;
    }


    private @Nullable CompletionAnswerSummary getCompletionSummary(Message message, Project project, TaskNode documentNode, CompletionRuntimeOverridesDTO overrides) {
        CompletionAnswerSummary answer;
        List<Message> response = null;
        try {
            response = completionService.getCompletion(message, new ArrayList<>(), project, buildResponseSchema(new ParameterizedTypeReference<CompletionAnswerSummary>() {
            }), overrides);
            answer = objectMapper.readValue(response.getLast().getValue(), CompletionAnswerSummary.class);
        } catch (GendoxException e) {
            logger.warn("Error getting completion for message: {}, error: {}", message.getId(), e.getMessage());
            logger.warn("Skipping summarizing answers dor documentId: {}",
                    documentNode.getDocumentId());
            return null;

        } catch (JsonProcessingException | IllegalArgumentException e) {
            logger.warn("Error converting Json completion to GroupedQuestionAnswers, message: {}, error: {}", message.getId(), e.getMessage());
            logger.warn("Response Completion message is: {}", response.getLast().getValue());
            logger.warn("Skipping processing documentId: {}",
                    documentNode.getDocumentId());
            return null;
        } catch (Exception e) {
            logger.warn("Unexpected error during completion for message: {}, error: {}", message.getId(), e.getMessage());
            return null;
        }
        return answer;
    }


}

