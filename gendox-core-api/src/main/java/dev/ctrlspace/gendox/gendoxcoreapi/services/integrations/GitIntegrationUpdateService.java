package dev.ctrlspace.gendox.gendoxcoreapi.services.integrations;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.ObjectIdConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.discord.Listener;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Integration;
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
    public List<MultipartFile> checkForUpdates(Integration integration) {
        List<MultipartFile> fileList = new ArrayList<>();

        String path = temporaryStorage + "/" + integration.getId().toString();
        File directory = new File(path);
        boolean shouldUpdateMap = false;

        try {
            logger.info("check if the integration's Directory is empty ");
            if (isDirectoryEmpty(directory)) {
                logger.info("Git clone ");
                git = Git.cloneRepository()
                        .setURI(integration.getUrl())
                        .setDirectory(directory)
                        .call();

            } else {
                try {
                    logger.info("Git open ");
                    git = Git.open(directory);
                } catch (RepositoryNotFoundException e) {
                    logger.error("The folder does not contain .git files : " + e.getMessage());
                    throw new RuntimeException(e);

                }
            }

            if (integration.getRepoHead() == null) {
                logger.info("should-update = true ");
                shouldUpdateMap = true;

            } else {
                //Record the current HEAD commit
                ObjectId oldHeadCommitRepository = objectIdConverter.convertToEntityAttribute(integration.getRepoHead());

                // Perform the pull
                logger.info("Git pull ");
                git.pull().call();

                // Check if HEAD changed
                ObjectId newHeadCommitRepository = git.getRepository().resolve("HEAD^{tree}");
                shouldUpdateMap = !newHeadCommitRepository.equals(oldHeadCommitRepository);
            }

            if (shouldUpdateMap) {
                logger.info("Update integration ");
                integration.setDirectoryPath(directory.getPath());

                integration.setRepoHead(objectIdConverter.convertToDatabaseColumnString(git.getRepository().resolve("HEAD^{tree}")));
                integration = integrationRepository.save(integration);
                return fileList = createFileList(git);
            }

        } catch (GitAPIException | IOException e) {
            logger.error("Git integration failed : " + e.getMessage());
            e.printStackTrace();
        }

        return fileList;
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


}
