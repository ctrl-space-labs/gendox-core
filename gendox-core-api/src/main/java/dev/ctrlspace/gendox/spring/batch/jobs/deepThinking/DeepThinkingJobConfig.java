package dev.ctrlspace.gendox.spring.batch.jobs.deepThinking;

import dev.ctrlspace.gendox.spring.batch.jobs.deepThinking.steps.DeepThinkingTasklet;
import org.springframework.batch.core.Job;
import org.springframework.batch.core.Step;
import org.springframework.batch.core.job.builder.JobBuilder;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.batch.core.step.builder.StepBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.PlatformTransactionManager;

@Configuration
public class DeepThinkingJobConfig {

    public static final String JOB_NAME = "deepThinkingJob";
    public static final String STEP_NAME = "deepThinkingStep";

    private final JobRepository jobRepository;

    public DeepThinkingJobConfig(JobRepository jobRepository) {
        this.jobRepository = jobRepository;
    }

    @Bean
    public Job deepThinkingJob(Step deepThinkingStep) {
        return new JobBuilder(JOB_NAME, jobRepository)
                .start(deepThinkingStep)
                .build();
    }

    @Bean
    public Step deepThinkingStep(DeepThinkingTasklet tasklet,
                                  PlatformTransactionManager transactionManager) {
        return new StepBuilder(STEP_NAME, jobRepository)
                .tasklet(tasklet, transactionManager)
                .build();
    }
}
