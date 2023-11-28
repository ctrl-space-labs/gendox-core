package dev.ctrlspace.gendox.spring.batch.jobs;

import dev.ctrlspace.gendox.spring.batch.jobs.common.UniqueInstanceDecider;
import dev.ctrlspace.gendox.spring.batch.model.BatchJobExecution;
import dev.ctrlspace.gendox.spring.batch.repositories.BatchJobExecutionRepository;
import dev.ctrlspace.gendox.spring.batch.jobs.training.TrainingJobConfig;
import dev.ctrlspace.gendox.spring.batch.services.SpringBatchService;
import org.springframework.batch.core.Job;
import org.springframework.batch.core.JobExecution;
import org.springframework.batch.core.JobParameters;
import org.springframework.batch.core.JobParametersBuilder;
import org.springframework.batch.core.configuration.annotation.EnableBatchProcessing;
import org.springframework.batch.core.launch.JobLauncher;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

import java.time.Instant;


@Configuration
@EnableBatchProcessing(
        tablePrefix = "gendox_jobs.batch_",
        maxVarCharLength = 1000,
        isolationLevelForCreate = "ISOLATION_REPEATABLE_READ")
@ComponentScan(basePackageClasses = {UniqueInstanceDecider.class,
        SpringBatchService.class,
        TrainingJobConfig.class})
@EnableJpaRepositories(basePackageClasses = {BatchJobExecutionRepository.class})
@EntityScan(basePackageClasses = {BatchJobExecution.class})
public class SpringBatchConfiguration implements ApplicationRunner {

    @Autowired
    private JobLauncher jobLauncher;

    @Autowired
    private SpringBatchService springBatchService;

    @Autowired
    private Job documentTrainingJob;

    @Override
    public void run(ApplicationArguments args) throws Exception {
//        JobParameters params = new JobParametersBuilder()
////                .addString("documentInstanceId", "cc410aed-3295-43f1-b172-3d97d40c0da8")
//                .addString("projectId", "993b935a-441f-4428-aa0a-cc6ece6705db")
//                .addString("updatedBetween.from", "2022-10-05T18:53:46.700Z")
//                .addString("updatedBetween.to", "2023-11-08T18:53:46.800Z")
//                .addString("now", Instant.now().toString())
//                .addLong("pageSize", 100L)
//                .toJobParameters();
//        jobLauncher.run(documentTrainingJob, params);

//        JobExecution jobExecution = springBatchService.runTrainingWithParams();



    }



}
