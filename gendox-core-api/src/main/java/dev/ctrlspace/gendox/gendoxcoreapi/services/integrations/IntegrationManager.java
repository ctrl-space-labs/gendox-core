package dev.ctrlspace.gendox.gendoxcoreapi.services.integrations;


import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Integration;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.IntegratedFileDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ProjectIntegrationDTO;
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

import java.util.*;

@Service

public class IntegrationManager {

    Logger logger = LoggerFactory.getLogger(IntegrationManager.class);

    private GitIntegrationUpdateService gitIntegrationUpdateService;
    private IntegrationRepository integrationRepository;
    private TypeService typeService;
    private S3BucketIntegrationUpdateService s3BucketIntegrationUpdateService;
    private ApiIntegrationUpdateService apiIntegrationUpdateService;

    @Autowired
    public IntegrationManager(GitIntegrationUpdateService gitIntegrationUpdateService,
                              IntegrationRepository integrationRepository,
                              TypeService typeService,
                              S3BucketIntegrationUpdateService s3BucketIntegrationUpdateService,
                              ApiIntegrationUpdateService apiIntegrationUpdateService) {
        this.gitIntegrationUpdateService = gitIntegrationUpdateService;
        this.integrationRepository = integrationRepository;
        this.typeService = typeService;
        this.s3BucketIntegrationUpdateService = s3BucketIntegrationUpdateService;
        this.apiIntegrationUpdateService = apiIntegrationUpdateService;
    }

    @Observed(name = "integrationManager.dispatchToIntegrationServices",
            contextualName = "dispatchToIntegrationServices-integrationManager",
            lowCardinalityKeyValues = {
                    ObservabilityTags.LOGGABLE, "true",
                    ObservabilityTags.LOG_LEVEL, ObservabilityTags.LOG_LEVEL_DEBUG,
                    ObservabilityTags.LOG_METHOD_NAME, "true",
                    ObservabilityTags.LOG_ARGS, "false"
            })
    public Map<ProjectIntegrationDTO, List<IntegratedFileDTO>> dispatchToIntegrationServices() throws GendoxException {
        Map<ProjectIntegrationDTO, List<IntegratedFileDTO>> map = new HashMap<>();
        List<Integration> activeIntegrations = findActiveIntegrations();

        for (Integration integration : activeIntegrations) {
            processIntegration(integration, map);
        }

        return map;
    }


    private List<Integration> findActiveIntegrations() throws GendoxException {
        logger.debug("Searching for active integrations...");
        return integrationRepository.findActiveIntegrations()
                .orElseThrow(() -> new GendoxException("ACTIVE_INTEGRATIONS_NOT_FOUND", "Active Integrations not founds", HttpStatus.NOT_FOUND));

    }


    private void processIntegration(Integration integration, Map<ProjectIntegrationDTO, List<IntegratedFileDTO>> map) throws GendoxException {

        logger.debug("Processing integration");

        if (integration.getIntegrationType().equals(typeService.getIntegrationTypeByName(IntegrationTypesConstants.GIT_INTEGRATION))) {
            processGitIntegration(integration, map);
        } else if (integration.getIntegrationType().equals(typeService.getIntegrationTypeByName(IntegrationTypesConstants.AWS_S3_INTEGRATION))) {
            processS3Integration(integration, map);
        } else if (integration.getIntegrationType().equals(typeService.getIntegrationTypeByName(IntegrationTypesConstants.API_INTEGRATION))) {
            processApiIntegration(integration, map);
        } else {
            logger.error("Unsupported integration type");

        }

    }

    private void processGitIntegration(Integration integration, Map<ProjectIntegrationDTO, List<IntegratedFileDTO>> map) throws GendoxException {
        logger.debug("Processing Git integration...");
        Map<ProjectIntegrationDTO, List<IntegratedFileDTO>> projectMap = gitIntegrationUpdateService.checkForUpdates(integration);
        updateMap(projectMap, map);
    }

    private void processS3Integration(Integration integration, Map<ProjectIntegrationDTO, List<IntegratedFileDTO>> map) throws GendoxException {
        logger.debug("Processing AWS S3 integration...");
        Map<ProjectIntegrationDTO, List<IntegratedFileDTO>> projectMap = s3BucketIntegrationUpdateService.checkForUpdates(integration);
        updateMap(projectMap, map);
    }

    private void processApiIntegration(Integration integration, Map<ProjectIntegrationDTO, List<IntegratedFileDTO>> map) throws GendoxException {
        logger.debug("Processing API integration...");
        Map<ProjectIntegrationDTO, List<IntegratedFileDTO>> projectMap = apiIntegrationUpdateService.checkForUpdates(integration);
        updateMap(projectMap, map);
    }

    private void updateMap(Map<ProjectIntegrationDTO, List<IntegratedFileDTO>> projectMap, Map<ProjectIntegrationDTO, List<IntegratedFileDTO>> map) throws GendoxException {

        logger.debug("Integration update found");
        for (Map.Entry<ProjectIntegrationDTO, List<IntegratedFileDTO>> entry : projectMap.entrySet()) {
            if (!entry.getValue().isEmpty()) {
                // Merge lists if the key already exists
                map.merge(entry.getKey(), entry.getValue(), (existingList, newList) -> {
                    existingList.addAll(newList); // Combine existing and new lists
                    return existingList;
                });
            }
        }

    }


}

