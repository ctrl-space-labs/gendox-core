package dev.ctrlspace.gendox.spring.batch.jobs.demojob;

import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstanceSection;
import dev.ctrlspace.gendox.spring.batch.jobs.demojob.steps.DemoProcessor;
import dev.ctrlspace.gendox.spring.batch.jobs.demojob.steps.DemoReader;
import dev.ctrlspace.gendox.spring.batch.jobs.demojob.steps.DemoWriter;
import dev.ctrlspace.gendox.spring.batch.jobs.training.steps.*;
import org.springframework.batch.core.Job;
import org.springframework.batch.core.Step;
import org.springframework.batch.core.job.builder.FlowBuilder;
import org.springframework.batch.core.job.builder.JobBuilder;
import org.springframework.batch.core.job.flow.Flow;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.batch.core.step.builder.StepBuilder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.task.TaskExecutor;
import org.springframework.transaction.PlatformTransactionManager;

@Configuration
@ComponentScan(basePackageClasses = {DemoReader.class})
public class DemoJobConfig {


    @Autowired
    private JobRepository jobRepository;


    @Bean
    public Step demoStep(DemoReader demoReader,
                         DemoProcessor demoProcessor,
                         DemoWriter demoWriter,
                         PlatformTransactionManager platformTransactionManager) {
        StepBuilder documentTrainingStepBuilder = new StepBuilder("DecmoStep", jobRepository);

        return documentTrainingStepBuilder
                .<String, Integer>chunk(2, platformTransactionManager) // Write in chunks of 10
                .reader(demoReader)
                .processor(demoProcessor)
                .writer(demoWriter)
                .build();
    }


    @Bean
    public Flow demoFlow(Step demoStep) {
        return new FlowBuilder<Flow>("Demo" + "Flow")
                .start(demoStep)
                .build();
    }

    /**
     * Includes all steps for the integration
     * - Upload
     * - Split
     * - Training
     *
     * @return
     */
//    @Bean
//    public Job fullIntegrationJob(Flow demoFlow, Flow documentTrainingFlow) {
//
//        return new JobBuilder("fullIntegrationJob", jobRepository)
//                .start(uniqueExecutionFlow(uploadFlow))
//                .next(splitFlow)
//                .next(documentTrainingFlow)
//                .end()
//                .build();
//
//    }

    @Bean
    public Job demoJob(Flow demoFlow) {

        return new JobBuilder("demoJob", jobRepository)
                .start(demoFlow)
                .end()
                .build();
    }


}
