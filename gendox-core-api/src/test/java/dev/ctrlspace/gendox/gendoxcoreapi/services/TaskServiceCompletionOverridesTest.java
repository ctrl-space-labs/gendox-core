package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.TaskConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Task;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.TaskNodeRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.TaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(MockitoExtension.class)
class TaskServiceCompletionOverridesTest {
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
                100000,
                4000L
        );
    }

    @Test
    void usesTaskDefaultMaxTokensWhenTaskSetsNone() {
        Task task = new Task();

        assertThat(taskService.buildDefaultCompletionOverrides(task).getMaxTokens()).isEqualTo(4000L);
    }

    @Test
    void keepsTaskMaxTokens() {
        Task task = new Task();
        task.setMaxToken(1200L);

        assertThat(taskService.buildDefaultCompletionOverrides(task).getMaxTokens()).isEqualTo(1200L);
    }
}
