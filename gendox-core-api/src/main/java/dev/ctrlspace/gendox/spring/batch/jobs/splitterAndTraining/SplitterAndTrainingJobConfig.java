package dev.ctrlspace.gendox.spring.batch.jobs.splitterAndTraining;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstanceSection;
import dev.ctrlspace.gendox.spring.batch.jobs.splitter.steps.*;
import dev.ctrlspace.gendox.spring.batch.jobs.training.steps.*;
import dev.ctrlspace.gendox.spring.batch.jobs.common.ObservabilityTaskDecorator;
import dev.ctrlspace.gendox.spring.batch.jobs.common.UniqueInstanceDecider;
import io.micrometer.observation.ObservationRegistry;
import org.springframework.batch.core.Job;
import org.springframework.batch.core.Step;
import org.springframework.batch.core.job.builder.JobBuilder;
import org.springframework.batch.core.job.flow.Flow;
import org.springframework.batch.core.job.flow.support.SimpleFlow;
import org.springframework.batch.core.job.builder.FlowBuilder;
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
public class SplitterAndTrainingJobConfig {

    @Value("${gendox.batch-jobs.splitter-and-training.job.name}")
    private String splitterAndTrainingJobName;

    // Splitter step config
    @Value("${gendox.batch-jobs.document-splitter.job.thread-pool-size}")
    private Integer splitterThreadPoolSize;
    @Value("${gendox.batch-jobs.document-splitter.job.steps.document-splitter-step.throttle-limit}")
    private Integer splitterThrottleLimit;
    @Value("${gendox.batch-jobs.document-splitter.job.steps.document-splitter-step.chunk-size}")
    private Integer splitterChunkSize;
    @Value("${gendox.batch-jobs.document-splitter.job.steps.document-splitter-step.name}")
    private String documentSplitterStepName;

    // Training step config
    @Value("${gendox.batch-jobs.document-training.job.thread-pool-size}")
    private Integer trainingThreadPoolSize;
    @Value("${gendox.batch-jobs.document-training.job.steps.document-training-step.name}")
    private String documentTrainingStepName;
    @Value("${gendox.batch-jobs.document-training.job.steps.document-training-step.throttle-limit}")
    private Integer trainingThrottleLimit;
    @Value("${gendox.batch-jobs.document-training.job.steps.document-training-step.chunk-size}")
    private Integer trainingChunkSize;

    @Autowired private JobRepository jobRepository;
    @Autowired private UniqueInstanceDecider uniqueInstanceDecider;
    @Autowired private ObservationRegistry observationRegistry;
    @Autowired private PlatformTransactionManager platformTransactionManager;

    // Step beans from Splitter
    @Autowired private DocumentSplitterReader documentSplitterReader;
    @Autowired private DocumentSplitterProcessor documentSplitterProcessor;
    @Autowired private DocumentSplitterWriter documentSplitterWriter;

    // Step beans from Training
    @Autowired private DocumentInstanceSectionReader documentInstanceSectionReader;
    @Autowired private DocumentInstanceSectionProcessor documentInstanceSectionProcessor;
    @Autowired private DocumentSectionEmbeddingWriter documentSectionEmbeddingWriter;

    @Bean
    public Job splitterAndTrainingJob() {
        // Build a flow: splitterStep -> trainingStep
        Flow combinedFlow = new FlowBuilder<Flow>("splitterAndTrainingFlow")
                .start(splitterStep())
                .next(trainingStep())
                .build();

        return new JobBuilder(splitterAndTrainingJobName, jobRepository)
                .start(uniqueExecutionFlow(combinedFlow))
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

    // ---- Step 1: Splitter Step ----
    @Bean
    public Step splitterStep() {
        return new StepBuilder(documentSplitterStepName, jobRepository)
                .<DocumentInstance, DocumentSectionDTO>chunk(splitterChunkSize, platformTransactionManager)
                .reader(documentSplitterReader)
                .processor(documentSplitterProcessor)
                .writer(documentSplitterWriter)
                .taskExecutor(splitterTaskExecutor())
                .build();
    }

    @Bean
    public TaskExecutor splitterTaskExecutor() {
        SimpleAsyncTaskExecutor executor = new SimpleAsyncTaskExecutor("b-splitter-");
        executor.setVirtualThreads(true);
        executor.setTaskDecorator(new ObservabilityTaskDecorator(observationRegistry));
        executor.setConcurrencyLimit(splitterThreadPoolSize);
        return executor;
    }

    // ---- Step 2: Training Step ----
    @Bean
    public Step trainingStep() {
        return new StepBuilder(documentTrainingStepName, jobRepository)
                .<DocumentInstanceSection, SectionEmbeddingDTO>chunk(trainingChunkSize, platformTransactionManager)
                .reader(documentInstanceSectionReader)
                .processor(documentInstanceSectionProcessor)
                .writer(documentSectionEmbeddingWriter)
                .taskExecutor(trainingTaskExecutor())
                .build();
    }

    @Bean
    public TaskExecutor trainingTaskExecutor() {
        SimpleAsyncTaskExecutor executor = new SimpleAsyncTaskExecutor("b-training-");
        executor.setVirtualThreads(true);
        executor.setTaskDecorator(new ObservabilityTaskDecorator(observationRegistry));
        executor.setConcurrencyLimit(trainingThreadPoolSize);
        return executor;
    }
}
