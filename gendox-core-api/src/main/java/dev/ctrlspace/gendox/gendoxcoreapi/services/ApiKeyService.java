package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.ApiKeyConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ApiKey;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ApiKeyDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ApiKeyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class ApiKeyService {

    private ApiKeyRepository apiKeyRepository;
    private ApiKeyConverter apiKeyConverter;

    @Autowired
    public ApiKeyService(ApiKeyRepository apiKeyRepository,
                         ApiKeyConverter apiKeyConverter) {
        this.apiKeyRepository = apiKeyRepository;
        this.apiKeyConverter = apiKeyConverter;
    }

    public ApiKey getById(UUID id) {
        return apiKeyRepository.findById(id).orElse(null);
    }

    public ApiKey getOrganizationId(String apiKey) throws GendoxException {
        return apiKeyRepository
                .findByApiKey(apiKey)
                .orElseThrow(
                        () -> new GendoxException("API_KEY_NOT_FOUND", "ApiKey not found", HttpStatus.NOT_FOUND)
                );
    }

    public List<ApiKey> getAllByOrganizationId(UUID organizationId) {
        return apiKeyRepository.findAllByOrganizationId(organizationId);
    }

    public ApiKey createApiKey(ApiKeyDTO apiKeyDTO) {
        ApiKey apiKey = apiKeyConverter.toEntity(apiKeyDTO);
        String generatedApiKey = "gxsk-" + UUID.randomUUID().toString().replace("-", "")
                + UUID.randomUUID().toString().replace("-", "");

        apiKey.setApiKey(generatedApiKey);
        return apiKeyRepository.save(apiKey);
    }

    public ApiKey updateApiKey(UUID id, ApiKeyDTO apiKeyDTO) throws GendoxException {
        ApiKey existingApiKey = apiKeyRepository.findById(id)
                .orElseThrow(() -> new GendoxException("APIKEY_NOT_FOUND", "ApiKey not found", HttpStatus.NOT_FOUND));

        // Update the fields of the existing ApiKey
        existingApiKey.setName(apiKeyDTO.getName());
        return apiKeyRepository.save(existingApiKey);
    }

    public void deleteApiKey(UUID id) throws GendoxException {
        if (!apiKeyRepository.existsById(id)) {
            throw (new GendoxException("APIKEY_NOT_FOUND", "ApiKey not found", HttpStatus.NOT_FOUND));
        }
        apiKeyRepository.deleteById(id);
    }

    public UUID getOrganizationIdByApiKey(String apiKey) throws GendoxException {
        return apiKeyRepository.findOrganizationIdByApiKey(apiKey)
                .orElseThrow(() -> new GendoxException("ORGANIZATION_NOT_FOUND", "OrganizationId not found", HttpStatus.NOT_FOUND));
    }
}
