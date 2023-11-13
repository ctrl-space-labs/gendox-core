package dev.ctrlspace.gendox.gendoxcoreapi.services.integration;

import dev.ctrlspace.gendox.gendoxcoreapi.model.Integration;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.IntegrationRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TypeService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.IntegrationTypesConstants;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.integration.support.MessageBuilder;
import org.springframework.stereotype.Service;

import java.io.File;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

@Service
public class GitIntegrationService implements IntegrationService {


    private IntegrationRepository integrationRepository;
    private TypeService typeService;

    @Autowired
    public GitIntegrationService(IntegrationRepository integrationRepository,
                                 TypeService typeService) {
        this.integrationRepository = integrationRepository;
        this.typeService = typeService;
    }

    private String repositoryUrl = "https://github.com/ctrl-space-labs/gendox-core.wiki.git";
    private Git git;

    public GitIntegrationService(String repositoryUrl) {
        this.repositoryUrl = repositoryUrl;
    }




//    @Override
//    public void checkForUpdates() {
//        try {
//            if (git == null) {
//                git = Git.cloneRepository()
//                        .setURI(repositoryUrl)
//                        .call();
//            } else {
//                git.pull().call();
//            }
//
//        } catch (GitAPIException e) {
//            e.printStackTrace();
//        }
//    }

    @Override
    public List<Path> checkForUpdates() {
        List<Path> fileList = new ArrayList<>();
        try {
            if (git == null) {
                git = Git.cloneRepository()
                        .setURI(repositoryUrl)
                        .setDirectory(new File("file:c:\\Users\\Giannis\\Desktop\\gendox-files\\test"))
                        .call();
            } else {
                git.pull().call();
            }
            // After cloning/pulling, list the files in the local repo directory
            File localRepoDir = git.getRepository().getDirectory().getParentFile();
            File[] files = localRepoDir.listFiles();
            if (files != null) {
                for (File file : files) {
                    fileList.add(file.toPath());
                }
            }
        } catch (GitAPIException e) {
            e.printStackTrace();
        }
        return fileList;
    }


}
