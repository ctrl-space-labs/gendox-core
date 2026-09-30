package dev.ctrlspace.gendox.gendoxcoreapi.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.decision.DecisionAnswer;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.decision.DecisionResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.CompletionRuntimeOverridesDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InsightQuestionServiceTest {
    @Mock private DecisionService decisionService;
    @Mock private CompletionService completionService;
    @Mock private MessageService messageService;
    @Mock private ProjectService projectService;
    @Mock private TaskService taskService;

    private InsightQuestionService service;

    @BeforeEach
    void setUp() {
        service = new InsightQuestionService(decisionService, completionService, messageService,
                projectService, taskService, new ObjectMapper());
    }

    @Test
    void autoCanExpandIntoIndependentDecisionColumns() throws Exception {
        UUID projectId = UUID.randomUUID();
        UUID taskId = UUID.randomUUID();
        ProjectAgent agent = new ProjectAgent();
        agent.setUserId(UUID.randomUUID());
        Project project = new Project();
        project.setId(projectId);
        project.setProjectAgent(agent);
        Task task = new Task();
        task.setId(taskId);
        task.setProjectId(projectId);
        task.setTaskType(Type.builder().name("DOCUMENT_INSIGHTS").build());
        task.setTaskPrompt("Review every eligibility rule independently.");

        when(taskService.getTaskById(taskId)).thenReturn(task);
        when(projectService.getProjectById(projectId)).thenReturn(project);
        when(decisionService.evaluate(eq(agent), any())).thenReturn(DecisionResponse.builder()
                .model("jev-latest")
                .answers(Map.of("classification", DecisionAnswer.builder().type("noul").noul(0.91).build()))
                .build());
        ChatThread thread = new ChatThread();
        thread.setId(UUID.randomUUID());
        when(messageService.createThreadForMessage(anyList(), eq(projectId), anyString())).thenReturn(thread);
        when(messageService.createMessage(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(taskService.buildDefaultCompletionOverrides(task)).thenReturn(new CompletionRuntimeOverridesDTO());

        Message completion = new Message();
        completion.setValue("""
                {"questions":[
                  {"title":"Age","message":"Is the applicant at least 18?","decision":{"kind":"BOOLEAN","instructions":"Does the document show age 18 or older?","booleanCriteria":{"true":"18 or older","false":"Under 18"}}},
                  {"title":"Residency","message":"What is the residency status?","decision":{"kind":"CHOICE","instructions":"Choose the documented residency status.","choices":{"citizen":"Citizen","resident":"Permanent resident","other":"Other"}}}
                ]}
                """);
        when(completionService.getCompletion(any(), anyList(), eq(project), any(), any())).thenReturn(List.of(completion));

        String sourceText = "Check age and residency eligibility";
        TaskNodeDTO auto = TaskNodeDTO.builder()
                .taskId(taskId)
                .nodeType("QUESTION")
                .nodeValue(TaskNodeValueDTO.builder()
                        .message(sourceText)
                        .questionTitle("Eligibility")
                        .insightConfig(InsightConfigDTO.builder().answerMode(InsightAnswerMode.AUTO).build())
                        .build())
                .build();

        List<TaskNodeDTO> created = service.resolveAutoQuestions(List.of(auto));

        assertThat(created).hasSize(2);
        assertThat(created).extracting(node -> node.getNodeValue().getQuestionTitle())
                .containsExactly("Age", "Residency");
        assertThat(created).allSatisfy(node -> {
            assertThat(node.getNodeValue().getInsightConfig().getAnswerMode()).isEqualTo(InsightAnswerMode.DECISION);
            assertThat(node.getNodeValue().getInsightConfig().getSourceQuestion()).isEqualTo(sourceText);
        });
    }

    @Test
    void autoCanResolveToWrittenAnswerWithoutCallingTheCompletionModel() throws Exception {
        UUID projectId = UUID.randomUUID();
        ProjectAgent agent = new ProjectAgent();
        Project project = new Project();
        project.setId(projectId);
        project.setProjectAgent(agent);
        Task task = new Task();
        task.setId(UUID.randomUUID());
        task.setProjectId(projectId);
        task.setTaskType(Type.builder().name("DOCUMENT_INSIGHTS").build());

        when(taskService.getTaskById(task.getId())).thenReturn(task);
        when(projectService.getProjectById(projectId)).thenReturn(project);
        when(decisionService.evaluate(eq(agent), any())).thenReturn(DecisionResponse.builder()
                .answers(Map.of("classification", DecisionAnswer.builder().noul(0.2).build()))
                .build());

        TaskNodeDTO auto = TaskNodeDTO.builder()
                .taskId(task.getId())
                .nodeType("QUESTION")
                .nodeValue(TaskNodeValueDTO.builder()
                        .message("Summarize the payment obligations")
                        .insightConfig(InsightConfigDTO.builder().answerMode(InsightAnswerMode.AUTO).build())
                        .build())
                .build();

        List<TaskNodeDTO> resolved = service.resolveAutoQuestions(List.of(auto));

        assertThat(resolved).singleElement().satisfies(question ->
                assertThat(question.getNodeValue().getInsightConfig().getAnswerMode())
                        .isEqualTo(InsightAnswerMode.GENERATED_TEXT));
        verifyNoInteractions(completionService, messageService);
    }

    @Test
    void writtenQuestionsBypassTheAutoPipeline() throws Exception {
        UUID projectId = UUID.randomUUID();
        Task task = new Task();
        task.setId(UUID.randomUUID());
        task.setProjectId(projectId);
        task.setTaskType(Type.builder().name("DOCUMENT_INSIGHTS").build());
        TaskNodeDTO written = TaskNodeDTO.builder()
                .taskId(task.getId())
                .nodeType("QUESTION")
                .nodeValue(TaskNodeValueDTO.builder()
                        .message("Summarize this document")
                        .insightConfig(InsightConfigDTO.generatedText())
                        .build())
                .build();

        when(taskService.getTaskById(task.getId())).thenReturn(task);

        List<TaskNodeDTO> resolved = service.resolveAutoQuestions(List.of(written));

        assertThat(resolved).containsExactly(written);
        verifyNoInteractions(projectService, decisionService, completionService, messageService);
    }
}
