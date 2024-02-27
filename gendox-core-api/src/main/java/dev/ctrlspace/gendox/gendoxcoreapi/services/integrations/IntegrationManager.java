package dev.ctrlspace.gendox.gendoxcoreapi.services.integrations;


import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Integration;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.IntegrationRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TypeService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.IntegrationTypesConstants;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.ObservabilityTags;
import io.micrometer.observation.annotation.Observed;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service

public class IntegrationManager {

    Logger logger = LoggerFactory.getLogger(IntegrationManager.class);

    private GitIntegrationUpdateService gitIntegrationUpdateService;
    private IntegrationRepository integrationRepository;
    private TypeService typeService;
    private S3BucketIntegrationUpdateService s3BucketIntegrationUpdateService;

    @Autowired
    public IntegrationManager(GitIntegrationUpdateService gitIntegrationUpdateService,
                              IntegrationRepository integrationRepository,
                              TypeService typeService,
                              S3BucketIntegrationUpdateService s3BucketIntegrationUpdateService) {
        this.gitIntegrationUpdateService = gitIntegrationUpdateService;
        this.integrationRepository = integrationRepository;
        this.typeService = typeService;
        this.s3BucketIntegrationUpdateService = s3BucketIntegrationUpdateService;
    }

    @Observed(name = "integrationManager.dispatchToIntegrationServices",
            contextualName = "dispatchToIntegrationServices-integrationManager",
            lowCardinalityKeyValues = {
                    ObservabilityTags.LOGGABLE, "true",
                    ObservabilityTags.LOG_LEVEL, ObservabilityTags.LOG_LEVEL_DEBUG,
                    ObservabilityTags.LOG_METHOD_NAME, "true",
                    ObservabilityTags.LOG_ARGS, "false"
            })
    public Map<Integration, List<MultipartFile>> dispatchToIntegrationServices() throws GendoxException {
        Map<Integration, List<MultipartFile>> map = new HashMap<>();
        List<Integration> activeIntegrations = findActiveIntegrations();

        for (Integration integration : activeIntegrations) {
            processIntegration(integration, map);
        }

        return map;
    }


    private List<Integration> findActiveIntegrations() {
        logger.debug("Searching for active integrations...");
        return integrationRepository.findActiveIntegrations();
    }

    private void processIntegration(Integration integration, Map<Integration, List<MultipartFile>> map) throws GendoxException {

        logger.debug("Processing integration");

        if (integration.getIntegrationType().equals(typeService.getIntegrationTypeByName(IntegrationTypesConstants.GIT_INTEGRATION))) {
            processGitIntegration(integration, map);
        } else if (integration.getIntegrationType().equals(typeService.getIntegrationTypeByName(IntegrationTypesConstants.AWS_S3_INTEGRATION))) {
            processS3Integration(integration, map);
        } else {
            logger.error("Unsupported integration type");

        }

    }

    private void processGitIntegration(Integration integration, Map<Integration, List<MultipartFile>> map) throws GendoxException {
        logger.debug("Processing Git integration...");
        List<MultipartFile> fileList = gitIntegrationUpdateService.checkForUpdates(integration);
        updateMap(integration, fileList, map);
    }

    private void processS3Integration(Integration integration, Map<Integration, List<MultipartFile>> map) throws GendoxException {
        logger.debug("Processing AWS S3 integration...");
        List<MultipartFile> fileList = s3BucketIntegrationUpdateService.checkForUpdates(integration);
        updateMap(integration, fileList, map);
    }

    private void updateMap(Integration integration, List<MultipartFile> fileList, Map<Integration, List<MultipartFile>> map) throws GendoxException {
        if (!fileList.isEmpty()) {
            logger.debug("Integration update found");
            Integration updatedIntegration = integrationRepository.findById(integration.getId())
                    .orElseThrow(() -> new GendoxException("INTEGRATION_NOT_FOUND", "Integration not found.", HttpStatus.NOT_FOUND));
            map.put(updatedIntegration, fileList);
        }
    }


}

