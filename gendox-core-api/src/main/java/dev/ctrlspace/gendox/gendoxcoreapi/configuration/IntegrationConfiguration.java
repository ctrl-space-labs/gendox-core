package dev.ctrlspace.gendox.gendoxcoreapi.configuration;



import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Integration;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ProjectService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.UploadService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.integrations.IntegrationManager;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.ObservabilityTags;
import dev.ctrlspace.gendox.spring.batch.services.SplitterBatchService;
import dev.ctrlspace.gendox.spring.batch.services.TrainingBatchService;
import io.micrometer.observation.annotation.Observed;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.batch.core.JobExecution;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.integration.annotation.InboundChannelAdapter;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.integration.config.EnableIntegration;
import org.springframework.integration.dsl.MessageChannels;
import org.springframework.integration.endpoint.MethodInvokingMessageSource;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageHandler;
import org.springframework.messaging.MessagingException;
import org.springframework.integration.core.MessageSource;
import org.springframework.integration.annotation.Poller;
import org.springframework.messaging.Message;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.util.List;
import java.util.Map;




@Configuration
@EnableIntegration
public class IntegrationConfiguration {

    Logger logger = LoggerFactory.getLogger(IntegrationConfiguration.class);

    @Value("${gendox.integrations.poller}")
    private long pollerDelay;

    private IntegrationManager integrationManager;
    private UploadService uploadService;
    private ProjectService projectService;
    private SplitterBatchService splitterBatchService;
    private TrainingBatchService trainingBatchService;


    @Autowired
    public IntegrationConfiguration(IntegrationManager integrationManager,
                                    UploadService uploadService,
                                    ProjectService projectService,
                                    SplitterBatchService splitterBatchService,
                                    TrainingBatchService trainingBatchService) {
        this.integrationManager = integrationManager;
        this.uploadService = uploadService;
        this.projectService = projectService;
        this.splitterBatchService = splitterBatchService;
        this.trainingBatchService = trainingBatchService;

    }


    //     Define the MessageSource
    @Bean
    @InboundChannelAdapter(value = "integrationChannel", poller = @Poller(fixedDelay = "${gendox.integrations.poller}"))
    public MessageSource<?> gitMessageSource() {
        MethodInvokingMessageSource source = new MethodInvokingMessageSource();
        source.setObject(integrationManager);
        source.setMethodName("dispatchToIntegrationServices");
        return source;
    }

    // Define the Message Channel
    @Bean
    public MessageChannel integrationChannel() {
        return MessageChannels.direct().getObject();
    }

    // Define the Service Activator
    @Bean
    @ServiceActivator(inputChannel = "integrationChannel")
    @Observed(name = "integrationConfiguration.integrationHandler",
            contextualName = "integrationHandler-integrationConfiguration",
            lowCardinalityKeyValues = {
                    ObservabilityTags.LOGGABLE, "true",
                    ObservabilityTags.LOG_LEVEL, ObservabilityTags.LOG_LEVEL_DEBUG,
                    ObservabilityTags.LOG_METHOD_NAME, "true",
                    ObservabilityTags.LOG_ARGS, "false"
            })
    public MessageHandler gitHandler() {
        return new MessageHandler() {
            @Override
            public void handleMessage(Message<?> message) throws MessagingException{
                Map<Integration, List<MultipartFile>> map = (Map<Integration, List<MultipartFile>>) message.getPayload();
                Boolean hasNewFiles = false;

                for (Map.Entry<Integration, List<MultipartFile>> entry : map.entrySet()) {
                    Integration integration = entry.getKey();
                    List<MultipartFile> files = entry.getValue();
                    for (MultipartFile file : files) {
                        hasNewFiles = true;
                        try {
                            Project project = projectService.getProjectById(integration.getProjectId());
                            logger.info("Upload document " + file.getName());
                            DocumentInstance documentInstance =
                                    uploadService.uploadFile(file, project.getOrganizationId(), project.getId());
                            logger.info("file : " + file.getName() +" uploaded");
                        } catch (Exception e) {
                            e.printStackTrace();
                        }
                    }
                    // Delete all the directory files except the .git folder
                    deleteDirectoryFiles(integration.getDirectoryPath());
                }

                if (hasNewFiles) {
                    try {
                        logger.info("Start splitter job ");
                        JobExecution splitterJobExecution = splitterBatchService.runAutoSplitter();
                        logger.info("Start training job ");
                        JobExecution trainingJobExecution = trainingBatchService.runAutoTraining();
                    }
                    catch (Exception e){
                        throw new RuntimeException(e);
                    }
                }

            }
        };
    }

    private void deleteDirectoryFiles(String directoryPath) {
        File directory = new File(directoryPath);
        if (directory.isDirectory()) {
            File[] files = directory.listFiles();
            if (files != null) {
                for (File file : files) {
                    // Skip hidden files and directories (like .git)
                    if (!file.isHidden()) {
                        if (file.isDirectory()) {
                            deleteDirectoryFiles(file.getAbsolutePath()); // Recursive delete for subdirectories
                        } else {
                            file.delete(); // Delete visible files
                        }
                    }
                }
            }
        }
    }


}

