package dev.ctrlspace.gendox.spring.batch.jobs;

import dev.ctrlspace.gendox.spring.batch.jobs.common.UniqueInstanceDecider;
import dev.ctrlspace.gendox.spring.batch.jobs.demojob.DemoJobConfig;
import dev.ctrlspace.gendox.spring.batch.jobs.documentInsights.DocumentInsightsJobConfig;
import dev.ctrlspace.gendox.spring.batch.jobs.splitter.SplitterJobConfig;
import dev.ctrlspace.gendox.spring.batch.jobs.tasks.TaskJobConfig;
import dev.ctrlspace.gendox.spring.batch.model.BatchJobExecution;
import dev.ctrlspace.gendox.spring.batch.repositories.BatchJobExecutionRepository;
import dev.ctrlspace.gendox.spring.batch.jobs.training.TrainingJobConfig;
import dev.ctrlspace.gendox.spring.batch.services.SplitterBatchService;
import dev.ctrlspace.gendox.spring.batch.services.TrainingBatchService;
import dev.ctrlspace.gendox.spring.batch.utils.JobUtils;
import org.springframework.batch.core.Job;
import org.springframework.batch.core.configuration.annotation.EnableBatchProcessing;
import org.springframework.batch.core.launch.JobLauncher;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;


@Configuration
@EnableBatchProcessing(
        tablePrefix = "gendox_jobs.batch_",
        maxVarCharLength = 1000,
        isolationLevelForCreate = "ISOLATION_REPEATABLE_READ")
@ComponentScan(basePackageClasses = {UniqueInstanceDecider.class,
        TrainingBatchService.class,
        DemoJobConfig.class,
        TrainingJobConfig.class,
        SplitterJobConfig.class,
        TaskJobConfig.class,
        JobUtils.class,
        DocumentInsightsJobConfig.class})
@EnableJpaRepositories(basePackageClasses = {BatchJobExecutionRepository.class})
@EntityScan(basePackageClasses = {BatchJobExecution.class})
public class SpringBatchConfiguration implements ApplicationRunner {

    @Autowired
    private JobLauncher jobLauncher;

    @Autowired
    private TrainingBatchService trainingBatchService;

    @Autowired
    private Job documentTrainingJob;

    @Autowired
    private Job demoJob;
    @Autowired
    private SplitterBatchService splitterBatchService;

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
//        jobLauncher.run(demoJob, new JobParametersBuilder().toJobParameters());
//        int x = 5;
//        JobExecution jobExecution = trainingBatchService.runAutoTraining();
//        JobExecution jobExecution2 = splitterBatchService.runAutoSplitter();

    }


}
