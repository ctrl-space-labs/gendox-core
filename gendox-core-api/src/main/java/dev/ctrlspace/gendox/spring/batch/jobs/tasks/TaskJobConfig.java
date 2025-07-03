package dev.ctrlspace.gendox.spring.batch.jobs.tasks;


import dev.ctrlspace.gendox.gendoxcoreapi.model.TaskNode;
import dev.ctrlspace.gendox.spring.batch.jobs.common.ObservabilityTaskDecorator;
import dev.ctrlspace.gendox.spring.batch.jobs.common.UniqueInstanceDecider;
import dev.ctrlspace.gendox.spring.batch.jobs.tasks.steps.TaskItemProcessor;
import dev.ctrlspace.gendox.spring.batch.jobs.tasks.steps.TaskItemReader;
import dev.ctrlspace.gendox.spring.batch.jobs.tasks.steps.TaskItemWriter;
import io.micrometer.observation.ObservationRegistry;
import org.springframework.batch.core.Job;
import org.springframework.batch.core.Step;
import org.springframework.batch.core.job.builder.FlowBuilder;
import org.springframework.batch.core.job.builder.JobBuilder;
import org.springframework.batch.core.job.flow.support.SimpleFlow;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.batch.core.step.builder.StepBuilder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Bean;
import org.springframework.core.task.SimpleAsyncTaskExecutor;
import org.springframework.core.task.TaskExecutor;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.batch.core.job.flow.Flow;


@Configuration
public class TaskJobConfig {

    @Value("${gendox.batch-jobs.task-job.job.name}")
    private String taskJobName;
    @Value("${gendox.batch-jobs.task-job.job.steps.task-step.name}")
    private String taskStepName;
    @Value("${gendox.batch-jobs.task-job.job.steps.task-step.chunk-size}")
    private int chunkSize;
    @Value("${gendox.batch-jobs.task-job.job.thread-pool-size}")
    private int threadPoolSize;

    @Autowired
    private JobRepository jobRepository;
    @Autowired
    private UniqueInstanceDecider uniqueInstanceDecider;

    @Bean
    public Job taskJob(Step taskStep) {
        Flow taskFlow = new FlowBuilder<Flow>(taskJobName + "Flow")
                .start(taskStep)
                .build();

        return new JobBuilder(taskJobName, jobRepository)
                .start(uniqueExecutionFlow(taskFlow))
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
    public Step taskStep(
            TaskItemReader reader,
            TaskItemProcessor processor,
            TaskItemWriter writer,
            TaskExecutor asyncBatchTaskExecutor,
            PlatformTransactionManager platformTransactionManager
    ) {
        return new StepBuilder(taskStepName, jobRepository)
                .<TaskNode, TaskNode>chunk(chunkSize, platformTransactionManager)
                .reader(reader)
                .processor(processor)
                .writer(writer)
                .taskExecutor(asyncBatchTaskExecutor)
                .build();
    }

    @Bean
    public TaskExecutor asyncBatchTaskExecutor(ObservationRegistry obsRegistry) {
        SimpleAsyncTaskExecutor executor = new SimpleAsyncTaskExecutor("b-task-");
        executor.setVirtualThreads(true);
        executor.setTaskDecorator(new ObservabilityTaskDecorator(obsRegistry));
        executor.setConcurrencyLimit(threadPoolSize);
        return executor;
    }

}
