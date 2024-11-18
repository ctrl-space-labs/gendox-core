package dev.ctrlspace.gendox.gendoxcoreapi.services.integrations;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Integration;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.IntegratedFileDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ProjectIntegrationDTO;

import java.util.List;
import java.util.Map;


public interface IntegrationUpdateService {
    Map<ProjectIntegrationDTO, List<IntegratedFileDTO>> checkForUpdates(Integration integration) throws GendoxException;
}
