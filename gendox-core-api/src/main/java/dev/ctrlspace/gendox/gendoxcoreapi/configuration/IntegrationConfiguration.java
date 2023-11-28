package dev.ctrlspace.gendox.gendoxcoreapi.configuration;


import dev.ctrlspace.gendox.gendoxcoreapi.model.Integration;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ProjectRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ProjectService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.UploadService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.integrations.IntegrationManager;
import org.springframework.beans.factory.annotation.Autowired;
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

    private IntegrationManager integrationManager;
    private UploadService uploadService;
    private ProjectService projectService;

    @Autowired
    public IntegrationConfiguration(IntegrationManager integrationManager,
                                    UploadService uploadService,
                                    ProjectService projectService) {
        this.integrationManager = integrationManager;
        this.uploadService = uploadService;
        this.projectService = projectService;
    }


    //     Define the MessageSource
    @Bean
    @InboundChannelAdapter(value = "integrationChannel", poller = @Poller(fixedDelay = "30000"))
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
    public MessageHandler gitHandler() {
        return new MessageHandler() {
            @Override
            public void handleMessage(Message<?> message) throws MessagingException {
                Map<Integration, List<MultipartFile>> map = (Map<Integration, List<MultipartFile>>) message.getPayload();

                for (Map.Entry<Integration, List<MultipartFile>> entry : map.entrySet()) {
                    Integration integration = entry.getKey();
                    List<MultipartFile> files = entry.getValue();
                    for (MultipartFile file : files) {
                        try {
                            // TODO change the uploadFile with branch job
                            Project project = projectService.getProjectById(integration.getProjectId());
                            uploadService.uploadFile(file, project.getOrganizationId(), project.getId());
                            System.out.println("FILE:----------->" + file.getName());
                        } catch (Exception e) {
                            e.printStackTrace();
                        }
                    }
                    // Delete all the directory files except the .git folder
                    deleteDirectoryFiles(integration.getDirectoryPath());
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

