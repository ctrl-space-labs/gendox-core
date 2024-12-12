package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.ApiKeyConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ApiKey;
import dev.ctrlspace.gendox.gendoxcoreapi.model.OrganizationWebSite;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import dev.ctrlspace.gendox.gendoxcoreapi.model.User;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ApiKeyDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ApiKeyRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.UserNamesConstants;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class ApiKeyService {

    private ApiKeyRepository apiKeyRepository;
    private ApiKeyConverter apiKeyConverter;

    private TypeService typeService;

    private UserService userService;



    @Autowired
    public ApiKeyService(ApiKeyRepository apiKeyRepository,
                         ApiKeyConverter apiKeyConverter,
                         TypeService typeService,
                         UserService userService) {
        this.apiKeyRepository = apiKeyRepository;
        this.apiKeyConverter = apiKeyConverter;
        this.typeService = typeService;
        this.userService = userService;
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

    public ApiKey getByApiKey(String apiKey) throws GendoxException{
        return apiKeyRepository.findByApiKey(apiKey)
                .orElse(null);
    }

    public ApiKey getByIntegrationId(UUID integrationId) throws GendoxException {
        return apiKeyRepository.findByIntegrationId(integrationId)
                .orElseThrow(() -> new GendoxException("API_KEY_NOT_FOUND", "No ApiKey found for the given integration ID", HttpStatus.NOT_FOUND));
    }

    public ApiKey validateApiKey(String key) throws GendoxException {
        ApiKey apiKey = this.getByApiKey(key);
        if (apiKey == null) {
            throw new GendoxException("API_KEY_NOT_FOUND", "No matching ApiKey found with the specified criteria", HttpStatus.NOT_FOUND);
        }
        return apiKey;
    }

    public ApiKey createApiKey(ApiKeyDTO apiKeyDTO) throws GendoxException {
        ApiKey apiKey = apiKeyConverter.toEntity(apiKeyDTO);
        String generatedApiKey = "gxsk-" + UUID.randomUUID().toString().replace("-", "")
                + UUID.randomUUID().toString().replace("-", "");

        apiKey.setApiKey(generatedApiKey);

        UUID apiKeyId = UUID.randomUUID();
        apiKey.setId(apiKeyId);

        var user = createUserForApiKey(apiKeyId, apiKey);

        return apiKeyRepository.save(apiKey);
    }

    /**
     * User entry for API key.
     * The API Key has the same ID as the user ID. This is to implement the OO principle of extending the User class
     *
     * @param apiKeyId
     * @param apiKey
     * @throws GendoxException
     */
    private User createUserForApiKey(UUID apiKeyId, ApiKey apiKey) throws GendoxException {
        //create user for the API Key. This is needed to track all actions of the API Key in the created_by and updated_by fields
        var user = new User();
        user.setId(apiKeyId); // same as the API Key ID, this will help implements OO principle of extending the User class
        user.setName("API_KEY_" + apiKey.getName());
        user.setUserName(apiKeyId.toString());

        user.setUserType(typeService.getUserTypeByName(UserNamesConstants.GENDOX_API_KEY));
        // TODO: this is just a Hack... Use Keycloak Attributes when the Gendox's Keycloak Service starts support attributes .
        //  So the Agent's surname is set to 'GENDOX_AGENT' for now
        user.setLastName(UserNamesConstants.GENDOX_API_KEY);

        // TODO: this user dont need to be added in keycloak. If there is any bug related to this, just uncomment the line below, AND TEST IT!!!
//        String keyIdpId = authenticationService.createUser(user, null, true, false);
//        user.setId(UUID.fromString(keyIdpId));
//        apiKey.setId(keyIdpId);

        return userService.createUser(user);
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

        // TODO: User entry related to this key, remain orphaned. We need a soft delete in the API Key table
    }

    public UUID getOrganizationIdByApiKey(String apiKey) throws GendoxException {
        return apiKeyRepository.findOrganizationIdByApiKey(apiKey)
                .orElseThrow(() -> new GendoxException("ORGANIZATION_NOT_FOUND", "OrganizationId not found", HttpStatus.NOT_FOUND));
    }
}
