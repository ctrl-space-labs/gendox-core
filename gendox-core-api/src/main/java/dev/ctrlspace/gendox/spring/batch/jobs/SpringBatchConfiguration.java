package dev.ctrlspace.gendox.spring.batch.jobs;

import org.springframework.core.task.TaskDecorator;
import dev.ctrlspace.gendox.spring.batch.jobs.common.UniqueInstanceDecider;
import dev.ctrlspace.gendox.spring.batch.jobs.deepThinking.DeepThinkingJobConfig;
import dev.ctrlspace.gendox.spring.batch.jobs.demojob.DemoJobConfig;
import dev.ctrlspace.gendox.spring.batch.jobs.documentDigitization.DocumentDigitizationJobConfig;
import dev.ctrlspace.gendox.spring.batch.jobs.documentInsights.DocumentInsightsJobConfig;
import dev.ctrlspace.gendox.spring.batch.jobs.secretsReencrypt.SecretsReencryptJobConfig;
import dev.ctrlspace.gendox.spring.batch.jobs.splitter.SplitterJobConfig;
import dev.ctrlspace.gendox.spring.batch.model.BatchJobExecution;
import dev.ctrlspace.gendox.spring.batch.repositories.BatchJobExecutionRepository;
import dev.ctrlspace.gendox.spring.batch.jobs.training.TrainingJobConfig;
import dev.ctrlspace.gendox.spring.batch.services.SplitterBatchService;
import dev.ctrlspace.gendox.spring.batch.services.TrainingBatchService;
import dev.ctrlspace.gendox.spring.batch.utils.JobExecutionParamConstants;
import dev.ctrlspace.gendox.spring.batch.utils.JobUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.batch.core.BatchStatus;
import org.springframework.batch.core.job.JobExecution;
import org.springframework.batch.core.job.parameters.JobParametersBuilder;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.boot.SpringApplication;
import org.springframework.context.ApplicationContext;
import org.springframework.batch.core.job.Job;
import org.springframework.batch.core.configuration.annotation.EnableBatchProcessing;
import org.springframework.batch.core.configuration.annotation.EnableJdbcJobRepository;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.batch.core.launch.JobOperator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.persistence.autoconfigure.EntityScan;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.task.SimpleAsyncTaskExecutor;
import org.springframework.core.task.TaskExecutor;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

import java.time.Instant;
import java.util.List;


@Configuration
@EnableBatchProcessing
@EnableJdbcJobRepository(
        tablePrefix = "gendox_jobs.batch_",
        maxVarCharLength = 1000,
        isolationLevelForCreate = Isolation.REPEATABLE_READ)
@ComponentScan(basePackageClasses = {UniqueInstanceDecider.class,
        TrainingBatchService.class,
        DemoJobConfig.class,
        TrainingJobConfig.class,
        SplitterJobConfig.class,
        JobUtils.class,
        DocumentDigitizationJobConfig.class,
        DocumentInsightsJobConfig.class,
        DeepThinkingJobConfig.class,
        SecretsReencryptJobConfig.class})
@EnableJpaRepositories(basePackageClasses = {BatchJobExecutionRepository.class})
@EntityScan(basePackageClasses = {BatchJobExecution.class})
public class SpringBatchConfiguration implements ApplicationRunner {

    private static final Logger logger = LoggerFactory.getLogger(SpringBatchConfiguration.class);

    /** The job to run from the command line, see {@link #run}. Empty when the application starts as usual. */
    @Value("${spring.batch.job.name:}")
    private String jobToRun;

    @Autowired
    private List<Job> jobs;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private ApplicationContext applicationContext;

    @Value("${gendox.batch-jobs.document-digitization.job.llm-completion-executor-pool-size}")
    private Integer digitizationLlmPoolSize;

    @Value("${gendox.batch-jobs.document-insights.job.llm-completion-executor-pool-size}")
    private Integer insightsLlmPoolSize;

    @Autowired
    private JobOperator jobOperator;

    @Autowired
    private TrainingBatchService trainingBatchService;

    @Autowired
    private Job documentTrainingJob;

    @Autowired
    private Job demoJob;
    @Autowired
    private SplitterBatchService splitterBatchService;

    @Bean
    public TaskExecutor asyncDigitizationLlmCompletionsExecutor(TaskDecorator taskDecorator) {
        SimpleAsyncTaskExecutor executor = new SimpleAsyncTaskExecutor("llm-completion-");
        executor.setVirtualThreads(true);
        executor.setTaskDecorator(taskDecorator);
        executor.setConcurrencyLimit(digitizationLlmPoolSize);
        return executor;
    }

    @Bean
    public TaskExecutor asyncInsightsLlmCompletionsExecutor(TaskDecorator taskDecorator) {
        SimpleAsyncTaskExecutor executor = new SimpleAsyncTaskExecutor("llm-insights-");
        executor.setVirtualThreads(true);
        executor.setTaskDecorator(taskDecorator);
        executor.setConcurrencyLimit(insightsLlmPoolSize);
        return executor;
    }

    /**
     * Runs one job and stops the application, for maintenance jobs:
     *
     * <pre>java -jar gendox-core-api.jar --spring.batch.job.name=secretsReencryptJob</pre>
     *
     * Arguments of the form {@code name=value} become job parameters. The exit
     * code is 0 when the job completed.
     */
    @Override
    public void run(ApplicationArguments args) throws Exception {
        if (jobToRun.isBlank()) {
            return;
        }
        Job job = jobs.stream()
                .filter(candidate -> candidate.getName().equals(jobToRun))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("spring.batch.job.name: there is no job " + jobToRun));

        JobParametersBuilder params = new JobParametersBuilder()
                .addString(JobExecutionParamConstants.JOB_NAME, jobToRun)
                .addString(JobExecutionParamConstants.NOW, Instant.now().toString());
        for (String arg : args.getNonOptionArgs()) {
            String[] nameAndValue = arg.split("=", 2);
            if (nameAndValue.length == 2) {
                params.addString(nameAndValue[0], nameAndValue[1]);
            }
        }

        // the job runs on another thread: wait for it
        JobExecution execution = jobOperator.start(job, params.toJobParameters());
        while (execution.isRunning()) {
            Thread.sleep(1000);
            execution = jobRepository.getJobExecution(execution.getId());
        }
        logger.info("Job {} ended with status {}: {}", jobToRun, execution.getStatus(), execution.getStepExecutions());

        int exitCode = execution.getStatus() == BatchStatus.COMPLETED ? 0 : 1;
        System.exit(SpringApplication.exit(applicationContext, () -> exitCode));
    }


}
