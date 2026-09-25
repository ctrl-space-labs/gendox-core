package dev.ctrlspace.gendox.spring.batch.jobs.documentInsights.steps;

import dev.ctrlspace.gendox.gendoxcoreapi.model.Task;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.TaskNodeCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.TaskDocumentQuestionsDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TaskNodeService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TaskService;
import dev.ctrlspace.gendox.spring.batch.utils.JobExecutionParamConstants;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.batch.core.JobParameters;
import org.springframework.batch.core.JobParametersBuilder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InsightsSummaryReaderTest {
    @Mock private TaskNodeService taskNodeService;
    @Mock private TaskService taskService;
    @Mock private InsightsUtils insightsUtils;

    private InsightsSummaryReader reader;
    private UUID taskId;
    private JobParameters jobParameters;

    @BeforeEach
    void setUp() {
        reader = new InsightsSummaryReader(taskNodeService, taskService, insightsUtils);
        taskId = UUID.randomUUID();
        jobParameters = new JobParametersBuilder()
                .addString(JobExecutionParamConstants.TASK_ID, taskId.toString())
                .toJobParameters();
    }

    @Test
    void returnsNoDocumentsWhenSummarizationIsDisabled() throws Exception {
        Task task = new Task();
        task.setSummarizationEnabled(false);
        when(taskService.getTaskById(taskId)).thenReturn(task);

        reader.initializeJpaPredicate(jobParameters);
        Page<TaskDocumentQuestionsDTO> result = reader.getPageFromRepository(PageRequest.of(0, 10));

        assertThat(result).isEmpty();
        verifyNoInteractions(insightsUtils, taskNodeService);
    }

    @Test
    void readsDocumentsWhenSummarizationIsEnabled() throws Exception {
        Task task = new Task();
        task.setSummarizationEnabled(true);
        TaskNodeCriteria criteria = new TaskNodeCriteria();
        Pageable pageable = PageRequest.of(0, 10);
        Page<TaskDocumentQuestionsDTO> expected = Page.empty(pageable);

        when(taskService.getTaskById(taskId)).thenReturn(task);
        when(insightsUtils.fromJobParamsToTaskNodeCriteria(jobParameters, taskId.toString())).thenReturn(criteria);
        when(taskNodeService.getDocumentsGroupedWithQuestions(criteria, pageable)).thenReturn(expected);

        reader.initializeJpaPredicate(jobParameters);
        Page<TaskDocumentQuestionsDTO> result = reader.getPageFromRepository(pageable);

        assertThat(result).isSameAs(expected);
        assertThat(criteria.getQuestionNodeIds()).isEmpty();
    }
}
