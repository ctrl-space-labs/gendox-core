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

    @Autowired
    public IntegrationManager(GitIntegrationUpdateService gitIntegrationUpdateService,
                              IntegrationRepository integrationRepository,
                              TypeService typeService) {
        this.gitIntegrationUpdateService = gitIntegrationUpdateService;
        this.integrationRepository = integrationRepository;
        this.typeService = typeService;
    }

    @Observed(name = "integrationManager.dispatchToIntegrationServices",
            contextualName = "dispatchToIntegrationServices-integrationManager",
            lowCardinalityKeyValues = {
                    ObservabilityTags.LOGGABLE, "true",
                    ObservabilityTags.LOG_LEVEL, ObservabilityTags.LOG_LEVEL_DEBUG,
                    ObservabilityTags.LOG_METHOD_NAME, "true",
                    ObservabilityTags.LOG_ARGS, "false"
            })
    public Map<Integration, List<MultipartFile>> dispatchToIntegrationServices() throws GendoxException{
        Map<Integration, List<MultipartFile>> map = new HashMap<>();
        List<Integration> integrations = new ArrayList<>();

        // git integrations

        logger.info("find Active Integrations ");
        integrations = integrationRepository.findActiveIntegrationsByType(typeService.getIntegrationTypeByName(IntegrationTypesConstants.GIT_INTEGRATION).getId());
        logger.info("After findActiveIntegrations ");
        for (Integration integration : integrations) {
            List<MultipartFile> fileList = gitIntegrationUpdateService.checkForUpdates(integration);
            if (!fileList.isEmpty()) {
                logger.info("find Integration by ID ");
                integration = integrationRepository.findById(integration.getId())
                        .orElseThrow(() -> new GendoxException("INTEGRATION_NOT_FOUND", "Integration not found. " , HttpStatus.NOT_FOUND));
                map.put(integration, fileList);
            }
        }

        // other integrations into the future

        return map;
    }


}
