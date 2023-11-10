package dev.ctrlspace.gendox.etljobs.configuration;

import dev.ctrlspace.gendox.etljobs.common.UniqueInstanceDecider;
import dev.ctrlspace.gendox.etljobs.model.BatchJobExecution;
import dev.ctrlspace.gendox.etljobs.repositories.BatchJobExecutionRepository;
import dev.ctrlspace.gendox.etljobs.training.jobs.TrainingJobConfig;
import dev.ctrlspace.gendox.gendoxcoreapi.model.User;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.DocumentDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.UserRepository;
import jakarta.persistence.EntityManagerFactory;
import org.springframework.batch.core.Job;
import org.springframework.batch.core.JobParameters;
import org.springframework.batch.core.JobParametersBuilder;
import org.springframework.batch.core.configuration.annotation.EnableBatchProcessing;
import org.springframework.batch.core.launch.JobLauncher;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.batch.core.repository.support.JobRepositoryFactoryBean;
import org.springframework.batch.item.data.RepositoryItemReader;
import org.springframework.batch.item.database.support.DefaultDataFieldMaxValueIncrementerFactory;
import org.springframework.batch.support.DatabaseType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.ConversionService;
import org.springframework.core.convert.support.ConfigurableConversionService;
import org.springframework.core.convert.support.DefaultConversionService;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.transaction.PlatformTransactionManager;

import javax.sql.DataSource;
import java.time.Instant;


@Configuration
@EnableBatchProcessing(
        tablePrefix = "gendox_jobs.batch_",
        maxVarCharLength = 1000,
        isolationLevelForCreate = "ISOLATION_REPEATABLE_READ")
@ComponentScan(basePackageClasses = {UniqueInstanceDecider.class,
        TrainingJobConfig.class})
@EnableJpaRepositories(basePackageClasses = {BatchJobExecutionRepository.class})
@EntityScan(basePackageClasses = {BatchJobExecution.class})
public class SpringBatchConfiguration implements ApplicationRunner {

    @Autowired
    private JobLauncher jobLauncher;

    @Autowired
    private Job documentTrainingJob;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        JobParameters params = new JobParametersBuilder()
//                .addString("documentInstanceId", "cc410aed-3295-43f1-b172-3d97d40c0da8")
                .addString("projectId", "993b935a-441f-4428-aa0a-cc6ece6705db")
                .addString("from", "2022-10-05T18:53:46.700Z")
                .addString("to", "2023-11-08T18:53:46.800Z")
                .addString("now", Instant.now().toString())
                .addLong("pageSize", 100L)
                .toJobParameters();
        jobLauncher.run(documentTrainingJob, params);
    }

//    @Autowired
//    private DataSource dataSource;
//
//    @Autowired
//    private EntityManagerFactory entityManagerFactory;
//
//    @Bean
//    public PlatformTransactionManager transactionManager(DataSource dataSource) {
//        return new DataSourceTransactionManager(dataSource);
//    }
//    @Bean
//    public JdbcTemplate jdbcTemplate(DataSource dataSource) {
//        return new JdbcTemplate(dataSource);
//    }
//    @Bean
//    public ConfigurableConversionService conversionService() {
//        DefaultConversionService conversionService = new DefaultConversionService();
//        // You can add custom converters if necessary
//        return conversionService;
//    }
//
//    // Define your JobRepository bean using the JobRepositoryFactoryBean
//    @Bean
//    public JobRepository jobRepository(PlatformTransactionManager transactionManager,
//                                       JdbcTemplate jdbcTemplate) throws Exception {
//        JobRepositoryFactoryBean factory = new JobRepositoryFactoryBean();
//        factory.setDataSource(dataSource);
//        factory.setTransactionManager(transactionManager);
//        factory.setDatabaseType("POSTGRES");
//        factory.setIsolationLevelForCreate("ISOLATION_SERIALIZABLE");
//        DefaultDataFieldMaxValueIncrementerFactory incrementerFactory = new DefaultDataFieldMaxValueIncrementerFactory(dataSource);
//        factory.setIncrementerFactory(incrementerFactory);
//        factory.setJdbcOperations(jdbcTemplate);
//        return factory.getObject();
//    }


}
