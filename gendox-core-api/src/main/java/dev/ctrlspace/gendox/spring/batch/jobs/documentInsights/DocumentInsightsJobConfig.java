package dev.ctrlspace.gendox.spring.batch.jobs.documentInsights;
import dev.ctrlspace.gendox.gendoxcoreapi.model.TaskNode;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.TaskDocumentInsightsDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.TaskNodeDTO;
import dev.ctrlspace.gendox.spring.batch.jobs.common.ObservabilityTaskDecorator;
import dev.ctrlspace.gendox.spring.batch.jobs.common.UniqueInstanceDecider;
import dev.ctrlspace.gendox.spring.batch.jobs.documentInsights.steps.DocumentInsightsProcessor;
import dev.ctrlspace.gendox.spring.batch.jobs.documentInsights.steps.DocumentInsightsReader;
import dev.ctrlspace.gendox.spring.batch.jobs.documentInsights.steps.DocumentInsightsWriter;
import io.micrometer.observation.ObservationRegistry;
import org.springframework.batch.core.Job;
import org.springframework.batch.core.Step;
import org.springframework.batch.core.job.builder.FlowBuilder;
import org.springframework.batch.core.job.builder.JobBuilder;
import org.springframework.batch.core.job.flow.Flow;
import org.springframework.batch.core.job.flow.support.SimpleFlow;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.batch.core.step.builder.StepBuilder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.task.SimpleAsyncTaskExecutor;
import org.springframework.core.task.TaskExecutor;
import org.springframework.transaction.PlatformTransactionManager;

import java.util.List;

@Configuration
public class DocumentInsightsJobConfig {

    @Value("${gendox.batch-jobs.document-insights.job.thread-pool-size}")
    private Integer threadPoolSize;
    @Value("${gendox.batch-jobs.document-insights.job.steps.document-insights-step.chunk-size}")
    private Integer chunkSize;
    @Value("${gendox.batch-jobs.document-insights.job.name}")
    private String documentInsightsJobName;
    @Value("${gendox.batch-jobs.document-insights.job.steps.document-insights-step.name}")
    private String documentInsightsStepName;

    @Autowired
    private JobRepository jobRepository;
    @Autowired
    private UniqueInstanceDecider uniqueInstanceDecider;

    @Bean
    public Job documentInsightsJob(Step documentInsightsStep) {

        Flow documentInsightsFlow = new FlowBuilder<Flow>(documentInsightsJobName + "Flow")
                .start(documentInsightsStep)
                .build();

        return new JobBuilder(documentInsightsJobName, jobRepository)
                .start(uniqueExecutionFlow(documentInsightsFlow))
                .end()
                .build();
    }

    public Flow uniqueExecutionFlow(Flow flow) {
        FlowBuilder<SimpleFlow> flowBuilder = new FlowBuilder<>("uniqueJobExecutionFlow");

        return flowBuilder
                .start(uniqueInstanceDecider)
                .on("CONTINUE").to(flow)
                .from(uniqueInstanceDecider)
                .on("DUPLICATE_EXECUTION").end("DUPLICATE_EXECUTION")
                .end();
    }

    @Bean
    public Step documentInsightsStep(DocumentInsightsReader reader,
                                     DocumentInsightsProcessor processor,
                                     DocumentInsightsWriter writer,
                                     TaskExecutor asyncBatchInsightsExecutor,
                                     PlatformTransactionManager platformTransactionManager) {

        StepBuilder stepBuilder = new StepBuilder(documentInsightsStepName, jobRepository);

        return stepBuilder
                .<TaskDocumentInsightsDTO, List<TaskNodeDTO>>chunk(chunkSize, platformTransactionManager)
                .reader(reader)
                .processor(processor)
                .writer(writer)
                .taskExecutor(asyncBatchInsightsExecutor)
                .build();
    }

    @Bean
    public TaskExecutor asyncBatchInsightsExecutor(ObservationRegistry observationRegistry) {

        SimpleAsyncTaskExecutor executor = new SimpleAsyncTaskExecutor("b-document-insights-");
        // switch to Loom’s virtual threads (each task → its own VT)
        executor.setVirtualThreads(true);

        executor.setTaskDecorator(new ObservabilityTaskDecorator(observationRegistry));
        // Throttle concurrency
        executor.setConcurrencyLimit(threadPoolSize);
        return executor;
    }
}
