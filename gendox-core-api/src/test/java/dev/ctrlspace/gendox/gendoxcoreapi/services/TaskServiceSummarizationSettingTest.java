package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.TaskConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Task;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.TaskDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.TaskNodeRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.TaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TaskServiceSummarizationSettingTest {
    @Mock private TaskRepository taskRepository;
    @Mock private TaskNodeRepository taskNodeRepository;
    @Mock private TypeService typeService;
    @Mock private TaskEdgeService taskEdgeService;
    @Mock private EOScriptService eoScriptService;
    @Mock private EOTaskGeometryService eoTaskGeometryService;
    @Mock private TaskConverter taskConverter;
    @Mock private AiModelService aiModelService;
    @Mock private TaskNodeService taskNodeService;
    @Mock private ProjectService projectService;
    @Mock private SubscriptionAiModelTierService subscriptionAiModelTierService;

    private TaskService taskService;

    @BeforeEach
    void setUp() {
        taskService = new TaskService(
                taskRepository,
                taskNodeRepository,
                typeService,
                taskEdgeService,
                eoScriptService,
                eoTaskGeometryService,
                taskConverter,
                aiModelService,
                taskNodeService,
                projectService,
                subscriptionAiModelTierService,
                10,
                5000,
                100000
        );
    }

    @Test
    void disablesSummarizationByDefaultForNewTasks() throws Exception {
        UUID projectId = UUID.randomUUID();
        TaskDTO taskDTO = new TaskDTO();
        Task task = new Task();

        when(taskConverter.toEntity(taskDTO)).thenReturn(task);
        when(taskRepository.save(task)).thenReturn(task);

        Task createdTask = taskService.createTask(projectId, taskDTO);

        assertThat(createdTask.getSummarizationEnabled()).isFalse();
    }

    @Test
    void preservesExplicitlyEnabledSummarization() throws Exception {
        UUID projectId = UUID.randomUUID();
        TaskDTO taskDTO = new TaskDTO();
        Task task = new Task();
        task.setSummarizationEnabled(true);

        when(taskConverter.toEntity(taskDTO)).thenReturn(task);
        when(taskRepository.save(task)).thenReturn(task);

        Task createdTask = taskService.createTask(projectId, taskDTO);

        assertThat(createdTask.getSummarizationEnabled()).isTrue();
    }
}
