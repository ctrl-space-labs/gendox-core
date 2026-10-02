package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.ApiKeyConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ApiKey;
import dev.ctrlspace.gendox.gendoxcoreapi.model.User;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ApiKeyDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ApiKeyRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.OrganizationWebSiteRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.UserNamesConstants;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class ApiKeyService {

    private ApiKeyRepository apiKeyRepository;
    private ApiKeyConverter apiKeyConverter;
    private OrganizationWebSiteRepository organizationWebSiteRepository;
    private TypeService typeService;
    private UserService userService;


    @Autowired
    public ApiKeyService(ApiKeyRepository apiKeyRepository,
                         ApiKeyConverter apiKeyConverter,
                         OrganizationWebSiteRepository organizationWebSiteRepository,
                         TypeService typeService,
                         UserService userService) {
        this.apiKeyRepository = apiKeyRepository;
        this.apiKeyConverter = apiKeyConverter;
        this.organizationWebSiteRepository = organizationWebSiteRepository;
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

    public ApiKey getByApiKey(String apiKey) throws GendoxException {
        return apiKeyRepository.findByApiKey(apiKey)
                .orElse(null);
    }

    public ApiKey getByIntegrationId(UUID integrationId) throws GendoxException {
        return apiKeyRepository.findByIntegrationId(integrationId)
                .orElseThrow(() -> new GendoxException("API_KEY_NOT_FOUND", "No ApiKey found for the given integration ID", HttpStatus.NOT_FOUND));
    }

    /**
     * The one place a key offered as a credential is judged: it has to exist, be
     * active, and be inside its own validity window. The authentication provider
     * makes the same judgement, but it keeps its own branches because Spring
     * Security needs the two failures told apart.
     */
    public ApiKey validateApiKey(String key) throws GendoxException {
        ApiKey apiKey = this.getByApiKey(key);
        if (apiKey == null) {
            throw new GendoxException("API_KEY_NOT_FOUND", "No matching ApiKey found with the specified criteria", HttpStatus.NOT_FOUND);
        }

        if (!Boolean.TRUE.equals(apiKey.getActive())) {
            throw new GendoxException("API_KEY_NOT_ACTIVE",
                    "This API key is not active", HttpStatus.FORBIDDEN);
        }

        Instant now = Instant.now();
        if (apiKey.getStartDate().isAfter(now) || apiKey.getEndDate().isBefore(now)) {
            throw new GendoxException("API_KEY_EXPIRED",
                    "This API key is outside its validity period", HttpStatus.FORBIDDEN);
        }

        return apiKey;
    }

    /**
     * Every key is reached through the organization in the path. An id that
     * belongs to another organization answers the same as an id that does not
     * exist anywhere, so nothing is learned by trying ids.
     */
    private ApiKey getOwnedBy(UUID organizationId, UUID id) throws GendoxException {
        return apiKeyRepository.findById(id)
                .filter(apiKey -> organizationId.equals(apiKey.getOrganizationId()))
                .orElseThrow(() -> new GendoxException("APIKEY_NOT_FOUND",
                        "ApiKey not found", HttpStatus.NOT_FOUND));
    }

    public ApiKey createApiKey(UUID organizationId, ApiKeyDTO apiKeyDTO) throws GendoxException {
        ApiKey apiKey = apiKeyConverter.toEntity(apiKeyDTO);
        apiKey.setOrganizationId(organizationId);
        apiKey.setActive(true);
        String generatedApiKey = "gxsk-" + UUID.randomUUID().toString().replace("-", "")
                + UUID.randomUUID().toString().replace("-", "");

        apiKey.setApiKey(generatedApiKey);

        UUID apiKeyId = UUID.randomUUID();
        apiKey.setId(apiKeyId);

        createUserForApiKey(apiKeyId, apiKey);

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

    public ApiKey updateApiKey(UUID organizationId, UUID id, ApiKeyDTO apiKeyDTO) throws GendoxException {
        ApiKey existingApiKey = getOwnedBy(organizationId, id);

        // Update the fields of the existing ApiKey
        existingApiKey.setName(apiKeyDTO.getName());
        return apiKeyRepository.save(existingApiKey);
    }


    /**
     * Removing a key does not remove its row. The key shares its id with a user
     * row that carries the authorship of everything the key ever created, and
     * `users` is referenced throughout the schema, so deleting it would take that
     * authorship with it. Marking the key inactive revokes it just as completely
     * — authentication already refuses inactive keys — and nothing is orphaned.
     */
    public void revokeApiKey(UUID organizationId, UUID id) throws GendoxException {
        ApiKey apiKey = getOwnedBy(organizationId, id);

        // already revoked: saying so a second time changes nothing
        if (!Boolean.TRUE.equals(apiKey.getActive())) {
            return;
        }

        // A revoked key stops working the moment it is revoked, so a website that
        // sends with it would start failing silently. Refuse while one does.
        long websitesUsingIt = organizationWebSiteRepository.countByApiKeyId(id);
        if (websitesUsingIt > 0) {
            throw new GendoxException("API_KEY_IN_USE",
                    "This API key is used by " + websitesUsingIt
                            + (websitesUsingIt == 1 ? " website" : " websites")
                            + ". Remove it from them first.",
                    HttpStatus.CONFLICT);
        }

        apiKey.setActive(false);
        apiKeyRepository.save(apiKey);
    }

    public UUID getOrganizationIdByApiKey(String apiKey) throws GendoxException {
        return apiKeyRepository.findOrganizationIdByApiKey(apiKey)
                .orElseThrow(() -> new GendoxException("ORGANIZATION_NOT_FOUND", "OrganizationId not found", HttpStatus.NOT_FOUND));
    }
}
