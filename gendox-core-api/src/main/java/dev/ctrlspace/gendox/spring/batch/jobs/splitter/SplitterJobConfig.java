package dev.ctrlspace.gendox.spring.batch.jobs.splitter;

import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.spring.batch.jobs.common.ObservabilityTaskDecorator;
import dev.ctrlspace.gendox.spring.batch.jobs.common.UniqueInstanceDecider;
import dev.ctrlspace.gendox.spring.batch.jobs.splitter.steps.DocumentSectionDTO;
import dev.ctrlspace.gendox.spring.batch.jobs.splitter.steps.DocumentSplitterProcessor;
import dev.ctrlspace.gendox.spring.batch.jobs.splitter.steps.DocumentSplitterReader;
import dev.ctrlspace.gendox.spring.batch.jobs.splitter.steps.DocumentSplitterWriter;
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
import org.springframework.core.task.VirtualThreadTaskExecutor;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.transaction.PlatformTransactionManager;

import java.util.List;


@Configuration
//@ComponentScan(basePackageClasses = {DemoReader.class})
public class SplitterJobConfig {

    @Value("${gendox.batch-jobs.document-splitter.job.thread-pool-size}")
    private Integer threadPoolSize;
    @Value("${gendox.batch-jobs.document-splitter.job.steps.document-splitter-step.throttle-limit}")
    private Integer throttleLimit;
    @Value("${gendox.batch-jobs.document-splitter.job.steps.document-splitter-step.chunk-size}")
    private Integer chunkSize;
    @Value("${gendox.batch-jobs.document-splitter.job.name}")
    private String documentSplitterJobName;
    @Value("${gendox.batch-jobs.document-splitter.job.steps.document-splitter-step.name}")
    private String documentSplitterStepName;


    @Autowired
    private JobRepository jobRepository;
    @Autowired
    private UniqueInstanceDecider uniqueInstanceDecider;


    @Bean
    public Job documentSplitterJob(Step documentSplitterStep) {

        Flow documentSplitterFlow = new FlowBuilder<Flow>(documentSplitterJobName +"Flow")
                .start(documentSplitterStep)
                .build();

        return new JobBuilder(documentSplitterJobName, jobRepository)
                .start(uniqueExecutionFlow(documentSplitterFlow))
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
    public Step documentSplitterStep(DocumentSplitterReader documentSplitterReader,
                                     DocumentSplitterProcessor documentSplitterProcessor,
                                     DocumentSplitterWriter documentSplitterWriter,
                                     TaskExecutor asyncBatchSplitterExecutor,
                                     PlatformTransactionManager platformTransactionManager) {

        StepBuilder documentSplitterStepBuilder = new StepBuilder(documentSplitterStepName, jobRepository);

        return documentSplitterStepBuilder
                .<DocumentInstance, DocumentSectionDTO>chunk(chunkSize, platformTransactionManager)
                .reader(documentSplitterReader)
                .processor(documentSplitterProcessor)
                .writer(documentSplitterWriter)
                .taskExecutor(asyncBatchSplitterExecutor)
//                .throttleLimit(throttleLimit)
                .build();

    }

    @Bean
    public TaskExecutor asyncBatchSplitterExecutor(ObservationRegistry observationRegistry) {


        SimpleAsyncTaskExecutor executor = new SimpleAsyncTaskExecutor("b-splitter-");
        // switch to Loom’s virtual threads (each task → its own VT)
        executor.setVirtualThreads(true);

        executor.setTaskDecorator(new ObservabilityTaskDecorator(observationRegistry));
        // Throttle concurrency
        executor.setConcurrencyLimit(threadPoolSize);
        return executor;

    }
}
