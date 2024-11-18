package dev.ctrlspace.gendox.gendoxcoreapi.services.integrations;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Integration;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.IntegratedFilesDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ProjectIntegrationDTO;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;


public interface IntegrationUpdateService {
    Map<ProjectIntegrationDTO, IntegratedFilesDTO> checkForUpdates(Integration integration) throws GendoxException;
}
