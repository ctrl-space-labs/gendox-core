package dev.ctrlspace.gendox.spring.batch.jobs.documentInsights.steps;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.knuddels.jtokkit.Encodings;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.decision.DecisionAnswer;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.decision.DecisionRequest;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.decision.DecisionResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.MessageLocalContextConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectAgent;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Task;
import dev.ctrlspace.gendox.gendoxcoreapi.model.TaskNode;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.DecisionKind;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.DecisionQuestionConfigDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.InsightAnswerMode;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.InsightConfigDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.TaskAnswerBatchDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.TaskDocumentMetadataDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.TaskDocumentQuestionsDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.TaskNodeValueDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.services.CompletionService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.DecisionService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.DocumentSectionService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.DocumentService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.JobService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.MessageService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ProjectService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TaskNodeService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TaskService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TypeService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.TaskNodeTypeConstants;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.task.SyncTaskExecutor;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DocumentInsightsProcessorDecisionGroupingTest {

    @Mock private TypeService typeService;
    @Mock private TaskService taskService;
    @Mock private CompletionService completionService;
    @Mock private DecisionService decisionService;
    @Mock private ProjectService projectService;
    @Mock private MessageService messageService;
    @Mock private DocumentSectionService documentSectionService;
    @Mock private TaskNodeService taskNodeService;
    @Mock private DocumentService documentService;
    @Mock private MessageLocalContextConverter messageLocalContextConverter;
    @Mock private JobService jobService;

    private DocumentInsightsProcessor processor;

    @BeforeEach
    void setUp() {
        processor = new DocumentInsightsProcessor(
                typeService,
                taskService,
                new ObjectMapper(),
                Encodings.newDefaultEncodingRegistry(),
                completionService,
                decisionService,
                projectService,
                messageService,
                documentSectionService,
                taskNodeService,
                documentService,
                messageLocalContextConverter,
                jobService,
                new SyncTaskExecutor());
        ReflectionTestUtils.setField(processor, "reGenerateExistingAnswers", false);
        ReflectionTestUtils.setField(processor, "maxDecisionInputTokens", 30_000);
    }

    @Test
    void groupsQuestionsByTheirCompleteDecisionState() throws Exception {
        UUID taskId = UUID.randomUUID();
        UUID projectId = UUID.randomUUID();
        UUID documentId = UUID.randomUUID();
        UUID documentNodeId = UUID.randomUUID();
        UUID supportingA = UUID.randomUUID();
        UUID supportingB = UUID.randomUUID();
        UUID supportingC = UUID.randomUUID();

        Task task = new Task();
        task.setId(taskId);
        task.setProjectId(projectId);
        task.setTaskPrompt("Use only explicit evidence.");

        ProjectAgent agent = new ProjectAgent();
        Project project = new Project();
        project.setId(projectId);
        project.setProjectAgent(agent);

        Type answerType = Type.builder().name(TaskNodeTypeConstants.ANSWER).build();
        TaskNode documentNode = new TaskNode();
        documentNode.setId(documentNodeId);
        documentNode.setTaskId(taskId);
        documentNode.setDocumentId(documentId);
        documentNode.setNodeValue(TaskNodeValueDTO.builder().build());

        TaskNode noSupport1 = decisionQuestion(taskId, List.of());
        TaskNode noSupport2 = decisionQuestion(taskId, List.of());
        TaskNode sameSupport1 = decisionQuestion(taskId, List.of(supportingA, supportingB));
        TaskNode sameSupport2 = decisionQuestion(taskId, List.of(supportingB, supportingA));
        TaskNode differentSupport = decisionQuestion(taskId, List.of(supportingC));
        List<TaskNode> questions = List.of(
                noSupport1, noSupport2, sameSupport1, sameSupport2, differentSupport);

        when(taskService.getTaskById(taskId)).thenReturn(task);
        when(projectService.getProjectById(projectId)).thenReturn(project);
        when(typeService.getTaskNodeTypeByName(TaskNodeTypeConstants.ANSWER)).thenReturn(answerType);
        when(taskNodeService.findAnswerNodeByDocumentAndQuestionOptional(eq(taskId), eq(documentNodeId), any()))
                .thenReturn(Optional.empty());
        when(documentSectionService.getFullNumberedDocumentText(any()))
                .thenAnswer(invocation -> "Text for " + invocation.getArgument(0));

        List<DecisionRequest> submittedRequests = new ArrayList<>();
        when(decisionService.evaluate(eq(agent), any())).thenAnswer(invocation -> {
            DecisionRequest request = invocation.getArgument(1);
            submittedRequests.add(request);
            Map<String, DecisionAnswer> responseAnswers = new LinkedHashMap<>();
            request.getQuestions().keySet().forEach(key -> responseAnswers.put(
                    key, DecisionAnswer.builder().noul(0.9).build()));
            return DecisionResponse.builder().model("jev-latest").answers(responseAnswers).build();
        });

        TaskAnswerBatchDTO result = processor.process(TaskDocumentQuestionsDTO.builder()
                .taskId(taskId)
                .documentNode(documentNode)
                .questionNodes(new ArrayList<>(questions))
                .build());

        assertEquals(Set.of(
                        Set.of(noSupport1.getId().toString(), noSupport2.getId().toString()),
                        Set.of(sameSupport1.getId().toString(), sameSupport2.getId().toString()),
                        Set.of(differentSupport.getId().toString())),
                submittedRequests.stream()
                        .map(request -> request.getQuestions().keySet())
                        .collect(Collectors.toSet()));
        assertEquals(5, result.getNewAnswers().size());
        assertEquals(
                questions.stream().map(TaskNode::getId).collect(Collectors.toSet()),
                result.getNewAnswers().stream()
                        .map(answer -> answer.getNewAnswer().getNodeValue().getNodeQuestionId())
                        .collect(Collectors.toSet()));
        assertTrue(submittedRequests.stream().allMatch(request -> request.getState() instanceof Map));
    }

    private static TaskNode decisionQuestion(UUID taskId, List<UUID> supportingDocumentIds) {
        DecisionQuestionConfigDTO decision = DecisionQuestionConfigDTO.builder()
                .kind(DecisionKind.BOOLEAN)
                .instructions("Decide using the supplied documents.")
                .build();
        TaskDocumentMetadataDTO metadata = TaskDocumentMetadataDTO.builder()
                .supportingDocumentIds(new ArrayList<>(supportingDocumentIds))
                .build();
        TaskNodeValueDTO value = TaskNodeValueDTO.builder()
                .insightConfig(InsightConfigDTO.builder()
                        .answerMode(InsightAnswerMode.DECISION)
                        .decision(decision)
                        .build())
                .documentMetadata(metadata)
                .build();
        TaskNode question = new TaskNode();
        question.setId(UUID.randomUUID());
        question.setTaskId(taskId);
        question.setNodeValue(value);
        return question;
    }
}
