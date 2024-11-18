package dev.ctrlspace.gendox.gendoxcoreapi.configuration;


import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.IntegratedFileDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ProjectIntegrationDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ProjectService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TypeService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.UploadService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.integrations.IntegrationManager;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.IntegrationTypesConstants;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.ObservabilityTags;
import dev.ctrlspace.gendox.integrations.gendoxnative.model.dto.ContentIdDTO;
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
import java.util.UUID;


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
    private TypeService typeService;


    @Autowired
    public IntegrationConfiguration(IntegrationManager integrationManager,
                                    UploadService uploadService,
                                    ProjectService projectService,
                                    SplitterBatchService splitterBatchService,
                                    TrainingBatchService trainingBatchService,
                                    TypeService typeService) {
        this.integrationManager = integrationManager;
        this.uploadService = uploadService;
        this.projectService = projectService;
        this.splitterBatchService = splitterBatchService;
        this.trainingBatchService = trainingBatchService;
        this.typeService = typeService;
    }


    //     Define the MessageSource
    @Bean
    @InboundChannelAdapter(value = "integrationChannel", poller = @Poller(fixedDelay = "${gendox.integrations.poller}"))
    public MessageSource<?> integrationMessageSource() {
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
    public MessageHandler integrationHandler() {
        return new MessageHandler() {
            @Override
            public void handleMessage(Message<?> message) throws MessagingException {

                // Integration handling logic
                logger.debug("Received integration message for processing: {}", message);


                Map<ProjectIntegrationDTO, List<IntegratedFileDTO>> map = (Map<ProjectIntegrationDTO, List<IntegratedFileDTO>>) message.getPayload();
                Boolean hasNewFiles = false;

                for (Map.Entry<ProjectIntegrationDTO, List<IntegratedFileDTO>> entry : map.entrySet()) {
                    ProjectIntegrationDTO projectIntegrationDTO = entry.getKey();
                    List<IntegratedFileDTO> integratedFilesDTO = entry.getValue();
                    for (IntegratedFileDTO file : integratedFilesDTO) {
                        hasNewFiles = true;
                        try {
                            Project project = projectService.getProjectById(projectIntegrationDTO.getProjectId());
                            // handle uploaded files
                            if (file.getMultipartFile() != null) {
                                logger.debug("Uploading document: {} for project: {}", file.getMultipartFile().getName(), project.getId());
                                DocumentInstance documentInstance =
                                        uploadService.uploadFile(file.getMultipartFile(), project.getOrganizationId(), project.getId());
                                logger.debug("Uploaded document: {} successfully", file.getMultipartFile().getName());
                            } else {  // handle external files that the content is not downloaded here
                                logger.debug("Upserting extrernal document Instance: {} for project: {}", file.getExternalFile().getContentId(), project.getId());

                                // TODO @Gianni, upsert Document instances, Test this
                                uploadService.upsertDocumentInstance(project.getOrganizationId(),
                                        project.getId(),
                                        file.getExternalFile().getRemoteUrl(),
                                        file.getExternalFile().getRemoteUrl(),
                                        UUID.randomUUID().toString());
                                logger.debug("extrernal document uploaded document: {} successfully", file.getExternalFile().getContentId());
                            }

                        } catch (Exception e) {
                            logger.error("Error uploading document: {}", e.getMessage(), e);
                            e.printStackTrace();
                        }
                    }
                    if (typeService.getIntegrationTypeByName(IntegrationTypesConstants.GIT_INTEGRATION).equals(projectIntegrationDTO.getIntegration().getIntegrationType())) {
                        // TODO @Gianni, delete API Integration files, will be done similar to S3. Not here.
                        // Delete all the directory files except the .git folder
                        deleteDirectoryFiles(projectIntegrationDTO.getIntegration().getDirectoryPath());
                        logger.debug("Deleted files in directory: {}", projectIntegrationDTO.getIntegration().getDirectoryPath());
                    }


                }

                if (hasNewFiles) {
                    try {
                        logger.debug("Starting splitter and training jobs");
                        JobExecution splitterJobExecution = splitterBatchService.runAutoSplitter();
                        JobExecution trainingJobExecution = trainingBatchService.runAutoTraining();
                        logger.debug("Splitter job status: {}, Training job status: {}", splitterJobExecution.getStatus(), trainingJobExecution.getStatus());
                    } catch (Exception e) {
                        logger.error("Error handling integration message: {}", e.getMessage(), e);
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

