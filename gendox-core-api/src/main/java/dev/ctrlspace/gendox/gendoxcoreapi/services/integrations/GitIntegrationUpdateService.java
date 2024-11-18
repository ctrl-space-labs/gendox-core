package dev.ctrlspace.gendox.gendoxcoreapi.services.integrations;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.ObjectIdConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.discord.Listener;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Integration;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.IntegratedFilesDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ProjectIntegrationDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.IntegrationRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.services.integrations.gitIntegration.FileSystemMultipartFile;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.ObservabilityTags;
import io.micrometer.observation.annotation.Observed;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.errors.RepositoryNotFoundException;
import org.eclipse.jgit.lib.ObjectId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;

import java.util.*;

@Component
public class GitIntegrationUpdateService implements IntegrationUpdateService {
    Logger logger = LoggerFactory.getLogger(Listener.class);

    @Value("${gendox.integrations.storage.temporary}")
    private String temporaryStorage;

    private IntegrationRepository integrationRepository;
    private ObjectIdConverter objectIdConverter;

    @Autowired
    public GitIntegrationUpdateService(IntegrationRepository integrationRepository,
                                       ObjectIdConverter objectIdConverter) {
        this.integrationRepository = integrationRepository;
        this.objectIdConverter = objectIdConverter;
    }

    private Git git;


    @Override
    @Observed(name = "gitIntegrationUpdateService.checkForUpdates",
            contextualName = "checkForUpdates-gitIntegrationUpdateService",
            lowCardinalityKeyValues = {
                    ObservabilityTags.LOGGABLE, "true",
                    ObservabilityTags.LOG_LEVEL, ObservabilityTags.LOG_LEVEL_DEBUG,
                    ObservabilityTags.LOG_METHOD_NAME, "true",
                    ObservabilityTags.LOG_ARGS, "false"
            })
    public Map<ProjectIntegrationDTO, IntegratedFilesDTO> checkForUpdates(Integration integration) throws GendoxException {
        Map<ProjectIntegrationDTO, IntegratedFilesDTO> projectMap = new HashMap<>();
        List<MultipartFile> fileList = new ArrayList<>();

        String path = temporaryStorage + "/" + integration.getId().toString();
        File directory = new File(path);

        boolean shouldUpdateMap = false;

        try {
            logger.debug("Checking for updates for integration: " + integration);

            if (isDirectoryEmpty(directory)) {
                logger.debug("Cloning repository: " + integration.getUrl());
                git = Git.cloneRepository()
                        .setURI(integration.getUrl())
                        .setDirectory(directory)
                        .call();

            } else {
                try {
                    logger.debug("Opening existing repository ");
                    git = Git.open(directory);
                } catch (RepositoryNotFoundException e) {
                    logger.error("The folder does not contain .git files : " + e.getMessage());
                    throw new RuntimeException(e);

                }
            }

            if (integration.getRepoHead() == null) {
                shouldUpdateMap = true;

            } else {
                //Record the current HEAD commit
                ObjectId oldHeadCommitRepository = objectIdConverter.convertToEntityAttribute(integration.getRepoHead());

                // Perform the pull
                logger.debug("Pulling changes from the repository");
                git.pull().call();

                // Check if HEAD changed
                ObjectId newHeadCommitRepository = git.getRepository().resolve("HEAD^{tree}");
                shouldUpdateMap = !newHeadCommitRepository.equals(oldHeadCommitRepository);
            }

            if (shouldUpdateMap) {
                logger.debug("Updating integration information");
                integration.setDirectoryPath(directory.getPath());

                integration.setRepoHead(objectIdConverter.convertToDatabaseColumnString(git.getRepository().resolve("HEAD^{tree}")));
                integration = integrationRepository.save(integration);
                projectMap = createMap(createFileList(git), integration);
                return projectMap;
            }

        } catch (GitAPIException | IOException e) {
            logger.error("Git integration failed : " + e.getMessage());
            e.printStackTrace();
        }
        projectMap = createMap(fileList, integration);
        return projectMap;
    }

    private boolean isDirectoryEmpty(File directory) {
        return !directory.exists() || (directory.isDirectory() && directory.list().length == 0);
    }


    private List<MultipartFile> createFileList(Git git) throws IOException {
        List<MultipartFile> fileList = new ArrayList<>();
        File localRepoDir = git.getRepository().getDirectory().getParentFile();
        File[] files = localRepoDir.listFiles();
        if (files != null) {
            for (File file : files) {
                if (!file.isDirectory()) {  // Filter out directories
                    fileList.add(new FileSystemMultipartFile(file));
                }
            }
        }
        return fileList;
    }

    private Map<ProjectIntegrationDTO, IntegratedFilesDTO> createMap(List<MultipartFile> fileList, Integration integration) {
        Map<ProjectIntegrationDTO, IntegratedFilesDTO> map = new HashMap<>();
        ProjectIntegrationDTO projectIntegrationDTO = ProjectIntegrationDTO.builder()
                .projectId(integration.getProjectId())
                .integrationId(integration.getId())
                .integrationType(integration.getIntegrationType())
                .directoryPath(integration.getDirectoryPath())
                .build();
        IntegratedFilesDTO integratedFilesDTO = IntegratedFilesDTO.builder()
                .multipartFiles(fileList)
                .build();
        map.put(projectIntegrationDTO, integratedFilesDTO);
        return map;
    }


}

