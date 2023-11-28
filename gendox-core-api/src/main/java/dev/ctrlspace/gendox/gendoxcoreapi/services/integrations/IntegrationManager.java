package dev.ctrlspace.gendox.gendoxcoreapi.services.integrations;


import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Integration;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.IntegrationRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TypeService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.IntegrationTypesConstants;
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


    public Map<Integration, List<MultipartFile>> dispatchToIntegrationServices() throws GendoxException{
        Map<Integration, List<MultipartFile>> map = new HashMap<>();
        List<Integration> integrations = new ArrayList<>();

        // git integrations
        integrations = integrationRepository.findActiveIntegrationsByType(typeService.getIntegrationTypeByName(IntegrationTypesConstants.GIT_INTEGRATION).getId());
        for (Integration integration : integrations) {
            List<MultipartFile> fileList = gitIntegrationUpdateService.checkForUpdates(integration);
            integration = integrationRepository.findById(integration.getId())
                    .orElseThrow(() -> new GendoxException("INTEGRATION_NOT_FOUND", "Integration not found. " , HttpStatus.NOT_FOUND));
            if (!fileList.isEmpty()) {
                map.put(integration, fileList);
            }
        }

        // other integrations into the future

        return map;
    }


}
