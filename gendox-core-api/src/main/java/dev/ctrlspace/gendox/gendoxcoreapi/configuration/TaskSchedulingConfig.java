package dev.ctrlspace.gendox.gendoxcoreapi.configuration;

import dev.ctrlspace.gendox.gendoxcoreapi.messages.QueueMessageTopicNameConstants;
import dev.ctrlspace.gendox.gendoxcoreapi.messages.postgres.QueueConsumerService;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.DailyUsageAggregationResultDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.services.BackendMaintenanceTaskService;
import dev.ctrlspace.gendox.spring.batch.services.SplitterAndTrainingBatchService;
import net.javacrumbs.shedlock.core.LockProvider;
import net.javacrumbs.shedlock.provider.jdbctemplate.JdbcTemplateLockProvider;
import net.javacrumbs.shedlock.spring.annotation.EnableSchedulerLock;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

import javax.sql.DataSource;
import java.time.Duration;
import java.time.Instant;

@Configuration
@EnableScheduling
@EnableSchedulerLock(defaultLockAtMostFor = "PT1M")
public class TaskSchedulingConfig {

    private final QueueConsumerService queueConsumerService;
    private final SplitterAndTrainingBatchService splitterAndTrainingBatchService;
    Logger logger = LoggerFactory.getLogger(TaskSchedulingConfig.class);

    private BackendMaintenanceTaskService backendMaintenanceTaskService;

    // to log the 1st time, after startup
    private Instant lastDebugHeartbeat = Instant.MIN;
    private static final Duration LOG_HEARTBEAT_INTERVAL = Duration.ofHours(1);
    private Duration fixedDelay;


    public TaskSchedulingConfig(BackendMaintenanceTaskService backendMaintenanceTaskService,
                                @Value("${gendox.maintenance.daily-usage-aggregator.fixed-delay:10s}") Duration fixedDelay, QueueConsumerService queueConsumerService, SplitterAndTrainingBatchService splitterAndTrainingBatchService) {
        this.backendMaintenanceTaskService = backendMaintenanceTaskService;
        this.fixedDelay = fixedDelay;
        this.queueConsumerService = queueConsumerService;
        this.splitterAndTrainingBatchService = splitterAndTrainingBatchService;
    }

    @Bean
    public LockProvider lockProvider(DataSource dataSource) {
        return new JdbcTemplateLockProvider(JdbcTemplateLockProvider.Configuration.builder()
                .withJdbcTemplate(new JdbcTemplate(dataSource))
                .withTableName("gendox_core.shedlock")
                .usingDbTime() // safer in clusters
                .build());
    }

    @Scheduled(fixedDelayString = "${gendox.maintenance.daily-usage-aggregator.fixed-delay:10s}")
    @SchedulerLock(name = "DailyUsageAggregator", lockAtMostFor = "PT1M", lockAtLeastFor = "PT1S")
    public void aggregateUsage() {
        logger.trace("Running daily usage aggregation task");
        DailyUsageAggregationResultDTO results = backendMaintenanceTaskService.aggregateDailyUsage();
        logger.trace("Daily usage aggregation task completed: {}", results);

        Instant now = Instant.now();

        if (Duration.between(lastDebugHeartbeat, now).compareTo(LOG_HEARTBEAT_INTERVAL) >= 0) {
            lastDebugHeartbeat = now;

            logger.debug("Daily usage aggregation task completed: {}", results);
            logger.debug("Rest assured, this task runs every {}", fixedDelay);
        }
    }


    @Scheduled(fixedDelayString = "${queue.documents.upload.poll-ms:10s}")
    public void autoTrainingJobPoller() {
        queueConsumerService.pollTopicOnce(QueueMessageTopicNameConstants.DOCUMENT_UPLOAD,
                500,
                splitterAndTrainingBatchService::runSplitterAndTrainingForBatchOfFiles);
    }


}
