package dev.ctrlspace.gendox.spring.batch.jobs.secretsReencrypt;

import dev.ctrlspace.gendox.spring.batch.jobs.secretsReencrypt.steps.SecretsReencryptReader;
import dev.ctrlspace.gendox.spring.batch.jobs.secretsReencrypt.steps.SecretsReencryptWriter;
import org.springframework.batch.core.job.Job;
import org.springframework.batch.core.job.builder.JobBuilder;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.batch.core.step.Step;
import org.springframework.batch.core.step.builder.StepBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.PlatformTransactionManager;

/**
 * Moves the stored secrets to the current encryption key, after the key list
 * changed. It is a maintenance job: it can be started by the API or from the
 * command line, see {@code SpringBatchConfiguration#run}.
 *
 * A run that stops halfway leaves values that all still decrypt; running the
 * job again continues.
 */
@Configuration
@ComponentScan(basePackageClasses = {SecretsReencryptReader.class})
public class SecretsReencryptJobConfig {

    public static final String JOB_NAME = "secretsReencryptJob";
    public static final String STEP_NAME = "secretsReencryptStep";
    public static final int CHUNK_SIZE = 100;

    private final JobRepository jobRepository;

    public SecretsReencryptJobConfig(JobRepository jobRepository) {
        this.jobRepository = jobRepository;
    }

    @Bean
    public Job secretsReencryptJob(Step secretsReencryptStep) {
        return new JobBuilder(JOB_NAME, jobRepository)
                .start(secretsReencryptStep)
                .build();
    }

    @Bean
    public Step secretsReencryptStep(SecretsReencryptReader reader,
                                     SecretsReencryptWriter writer,
                                     PlatformTransactionManager transactionManager) {
        return new StepBuilder(STEP_NAME, jobRepository)
                .<SecretsReencryptReader.StoredValue, SecretsReencryptReader.StoredValue>chunk(CHUNK_SIZE, transactionManager)
                .reader(reader)
                .writer(writer)
                .build();
    }
}
