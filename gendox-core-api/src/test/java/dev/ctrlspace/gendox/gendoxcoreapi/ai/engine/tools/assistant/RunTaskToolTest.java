package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.assistant;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.TextNode;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.ToolExecutionContext;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Task;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.TaskNodeCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.services.JobService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RunTaskToolTest {

    @Mock private AssistantToolSupport support;
    @Mock private JobService jobService;

    private RunTaskTool tool;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Project project = new Project();
    private final Task task = new Task();
    private ToolExecutionContext context;

    @BeforeEach
    void setUp() throws GendoxException {
        tool = new RunTaskTool(support, jobService);
        project.setId(UUID.randomUUID());
        task.setId(UUID.randomUUID());
        task.setProjectId(project.getId());
        Type insights = new Type();
        insights.setName("DOCUMENT_INSIGHTS");
        task.setTaskType(insights);
        context = new ToolExecutionContext(project, null, null, null, null, null);

        lenient().when(support.readArguments(any(), eq(RunTaskTool.Args.class))).thenReturn(new RunTaskTool.Args(task.getId(), null, null));
        lenient().when(support.loadTask(context, task.getId())).thenReturn(task);
        lenient().when(support.objectMapper()).thenReturn(objectMapper);
    }

    @Test
    void neverRegeneratesExistingAnswers() throws Exception {
        tool.execute(TextNode.valueOf("{}"), context);

        verify(support).requireProjectMember(context);
        ArgumentCaptor<TaskNodeCriteria> criteria = ArgumentCaptor.forClass(TaskNodeCriteria.class);
        verify(jobService).executeDocumentInsightsTask(eq(task), criteria.capture());
        assertEquals(Boolean.FALSE, criteria.getValue().getReGenerateExistingAnswers());
        assertEquals(task.getId(), criteria.getValue().getTaskId());
    }

    @Test
    void doesNotStartASecondRunWhileOneIsRunning() {
        when(jobService.isTaskRunning(project.getId(), task.getId())).thenReturn(true);

        GendoxException e = assertThrows(GendoxException.class, () -> tool.execute(TextNode.valueOf("{}"), context));

        assertEquals("TASK_ALREADY_RUNNING", e.getErrorCode());
        verify(jobService, never()).executeDocumentInsightsTask(any(), any());
    }

    @Test
    void refusesWhenThePersonBehindTheChatIsNotAMember() throws Exception {
        doThrow(new GendoxException("FORBIDDEN_SIGN_IN_AS_PROJECT_MEMBER", "no", HttpStatus.FORBIDDEN))
                .when(support).requireProjectMember(context);

        assertThrows(GendoxException.class, () -> tool.execute(TextNode.valueOf("{}"), context));
        verifyNoInteractions(jobService);
    }

    @Test
    void theDefinitionIsTheToolExampleRow() throws Exception {
        when(support.toolExample("run_task")).thenReturn(objectMapper.readTree(
                "{\"name\":\"run_task\",\"description\":\"Start a task run\",\"parameters\":{\"required\":[\"task_id\"]}}"));

        assertEquals("run_task", tool.getName());
        assertEquals("Start a task run", tool.getDescription());
        assertEquals("task_id", tool.getParametersSchema().get("required").get(0).asText());
    }
}
