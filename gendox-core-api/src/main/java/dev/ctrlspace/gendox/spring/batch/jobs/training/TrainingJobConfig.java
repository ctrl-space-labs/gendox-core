package dev.ctrlspace.gendox.spring.batch.jobs.training;

import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstanceSection;
import dev.ctrlspace.gendox.spring.batch.jobs.common.ObservabilityTaskDecorator;
import dev.ctrlspace.gendox.spring.batch.jobs.common.UniqueInstanceDecider;
import dev.ctrlspace.gendox.spring.batch.jobs.training.steps.*;
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
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.task.TaskExecutor;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.transaction.PlatformTransactionManager;


/**
 * Job that reads all the document section in a period and create embeddings for them
 */
@Configuration
@ComponentScan(basePackageClasses = {DocumentInstanceReader.class})
public class TrainingJobConfig {

    @Value("${gendox.batch-jobs.document-training.job.name}")
    private String documentTrainingJobName;

    @Value("${gendox.batch-jobs.document-training.job.thread-pool-size}")
    private Integer threadPoolSize;

    @Value("${gendox.batch-jobs.document-training.job.steps.document-training-step.name}")
    private String documentTrainingStepName;

    @Value("${gendox.batch-jobs.document-training.job.steps.document-training-step.throttle-limit}")
    private Integer throttleLimit;

    @Value("${gendox.batch-jobs.document-training.job.steps.document-training-step.chunk-size}")
    private Integer chunkSize;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private UniqueInstanceDecider uniqueInstanceDecider;

    @Bean
    public Job documentTrainingJob(Step documentTrainingStep) {

        // Build the job flow with the uniqueInstanceDecider
        Flow documentTrainingFlow = new FlowBuilder<Flow>(documentTrainingJobName + "Flow")
                .start(documentTrainingStep)
                .build();
        return new JobBuilder(documentTrainingJobName, jobRepository)
                .start(uniqueExecutionFlow(documentTrainingFlow))
                .end()
                .build();
    }

    public Flow uniqueExecutionFlow(Flow flow) {
        FlowBuilder<SimpleFlow> flowBuilder = new FlowBuilder<>("uniqueJobExecutionFlow");

        Flow uniqueExecutionFlow = flowBuilder
                .start(uniqueInstanceDecider)
                .on("CONTINUE").to(flow)
                .from(uniqueInstanceDecider)
                .on("DUPLICATE_EXECUTION").end("DUPLICATE_EXECUTION")
                .end();
        return uniqueExecutionFlow;
    }

    @Bean
    public Step documentTrainingStep(DocumentInstanceSectionReader documentInstanceSectionReader,
                                     DocumentInstanceSectionProcessor documentInstanceSectionProcessor,
                                     DocumentSectionEmbeddingWriter documentSectionEmbeddingWriter,
                                     TaskExecutor asyncBatchTrainingExecutor,
                                     PlatformTransactionManager platformTransactionManager) {
        StepBuilder documentTrainingStepBuilder = new StepBuilder(documentTrainingStepName, jobRepository);

        return documentTrainingStepBuilder
                .<DocumentInstanceSection, SectionEmbeddingDTO>chunk(chunkSize, platformTransactionManager) // Write in chunks of 10
                .reader(documentInstanceSectionReader)
                .processor(documentInstanceSectionProcessor)
                .writer(documentSectionEmbeddingWriter)
                .taskExecutor(asyncBatchTrainingExecutor)
                .throttleLimit(throttleLimit)
                .build();
    }

    @Bean
    public TaskExecutor asyncBatchTrainingExecutor() {

        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(threadPoolSize); // This is the number of concurrent tasks you want to run
        executor.setMaxPoolSize(threadPoolSize); // This allows the pool to grow under load, up to ten concurrent tasks
        executor.setQueueCapacity(threadPoolSize); // This is the queue capacity. Once the queue is full, new tasks will wait.
        executor.setThreadNamePrefix("b-training-");

        executor.setTaskDecorator(new ObservabilityTaskDecorator());
        executor.initialize();
        return executor;

    }

}
