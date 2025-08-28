package dev.ctrlspace.gendox.spring.batch.jobs.documentDigitization;

import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.TaskAnswerBatchDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.TaskDocumentMetadataDTO;
import dev.ctrlspace.gendox.spring.batch.jobs.common.ObservabilityTaskDecorator;
import dev.ctrlspace.gendox.spring.batch.jobs.common.UniqueInstanceDecider;
import dev.ctrlspace.gendox.spring.batch.jobs.documentDigitization.steps.DocumentDigitizationProcessor;
import dev.ctrlspace.gendox.spring.batch.jobs.documentDigitization.steps.DocumentDigitizationReader;
import dev.ctrlspace.gendox.spring.batch.jobs.documentDigitization.steps.DocumentDigitizationWriter;
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

@Configuration
public class DocumentDigitizationJobConfig {
    @Value("${gendox.batch-jobs.document-digitization.job.thread-pool-size}")
    private Integer threadPoolSize;
    @Value("${gendox.batch-jobs.document-digitization.job.steps.document-digitization-step.chunk-size}")
    private Integer chunkSize;
    @Value("${gendox.batch-jobs.document-digitization.job.name}")
    private String documentDigitizationJobName;
    @Value("${gendox.batch-jobs.document-digitization.job.steps.document-digitization-step.name}")
    private String documentDigitizationStepName;

    @Autowired
    private JobRepository jobRepository;
    @Autowired
    private UniqueInstanceDecider uniqueInstanceDecider;

    @Bean
    public Job documentDigitizationJob(Step documentDigitizationStep) {

        Flow documentDigitizationFlow = new FlowBuilder<Flow>(documentDigitizationJobName + "Flow")
                .start(documentDigitizationStep)
                .build();

        return new JobBuilder(documentDigitizationJobName, jobRepository)
                .start(uniqueExecutionFlow(documentDigitizationFlow))
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
    public Step documentDigitizationStep(DocumentDigitizationReader documentDigitizationReader,
                                         DocumentDigitizationProcessor documentDigitizationProcessor,
                                         DocumentDigitizationWriter documentDigitizationWriter,
                                         TaskExecutor asyncBatchDigitizationExecutor,
                                         PlatformTransactionManager transactionManager) {

        return new StepBuilder(documentDigitizationStepName, jobRepository)
                .<TaskDocumentMetadataDTO, TaskAnswerBatchDTO>chunk(chunkSize, transactionManager)
                .reader(documentDigitizationReader)
                .processor(documentDigitizationProcessor)
                .writer(documentDigitizationWriter)
                .taskExecutor(asyncBatchDigitizationExecutor)
                .build();
    }

    @Bean
    public TaskExecutor asyncBatchDigitizationExecutor(ObservationRegistry observationRegistry) {
        SimpleAsyncTaskExecutor executor = new SimpleAsyncTaskExecutor("b-document-digitization-");
        // switch to Loom’s virtual threads (each task → its own VT)
        executor.setVirtualThreads(true);

        executor.setTaskDecorator(new ObservabilityTaskDecorator(observationRegistry));
        // Throttle concurrency
        executor.setConcurrencyLimit(threadPoolSize);
        return executor;
    }

    @Bean
    public TaskExecutor asyncLlmCompletionsExecutor(ObservationRegistry observationRegistry) {
        SimpleAsyncTaskExecutor executor = new SimpleAsyncTaskExecutor("llm-completion-");
        // switch to Loom’s virtual threads (each task → its own VT)
        executor.setVirtualThreads(true);

        executor.setTaskDecorator(new ObservabilityTaskDecorator(observationRegistry));
        // Throttle concurrency
        executor.setConcurrencyLimit(threadPoolSize);
        return executor;
    }


}
