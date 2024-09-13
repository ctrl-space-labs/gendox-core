package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModel;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModelProvider;
import dev.ctrlspace.gendox.gendoxcoreapi.model.OrganizationModelProviderKey;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectAgent;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.OrganizationModelKeyCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.OrganizationModelProviderKeysRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.OrganizationModelKeysPredicates;
import org.jetbrains.annotations.NotNull;
import org.jetbrains.annotations.Nullable;
import org.slf4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class OrganizationModelKeyService {

    Logger logger = org.slf4j.LoggerFactory.getLogger(getClass());

    private OrganizationModelProviderKeysRepository organizationModelProviderKeysRepository;

    private final Environment environment;
    private AiModelService aiModelService;

    @Autowired
    public OrganizationModelKeyService(OrganizationModelProviderKeysRepository organizationModelProviderKeysRepository,
                                       Environment environment,
                                       AiModelService aiModelService) {
        this.organizationModelProviderKeysRepository = organizationModelProviderKeysRepository;
        this.environment = environment;
        this.aiModelService = aiModelService;
    }

    public OrganizationModelProviderKey getByIdAndOrganizationId(UUID id, UUID organizationId) throws GendoxException {
        return organizationModelProviderKeysRepository.findByIdAndOrganizationId(id, organizationId)
                .orElseThrow(() -> new GendoxException("ORGANIZATION_MODEL_KEY_NOT_FOUND", "Model key not found", HttpStatus.NOT_FOUND));
    }

    public Page<OrganizationModelProviderKey> getAllByCriteria(OrganizationModelKeyCriteria criteria, Pageable pageable) {

        Page<OrganizationModelProviderKey> organizationModelKeys = organizationModelProviderKeysRepository.findAll(OrganizationModelKeysPredicates.build(criteria), pageable);

        return organizationModelKeys;
    }

    public Page<OrganizationModelProviderKey> getAllByCriteriaWithHiddenKeys(OrganizationModelKeyCriteria criteria) {

        Page<OrganizationModelProviderKey> organizationModelKeys = this.getAllByCriteria(criteria, Pageable.unpaged());

        return hideKeys(organizationModelKeys);
    }

    public OrganizationModelProviderKey createModelKey(OrganizationModelProviderKey organizationModelProviderKey) throws GendoxException {
        AiModelProvider modelProvider = aiModelService.getProviderByName(organizationModelProviderKey.getAiModelProvider().getName()); // Check if AI model exists

        // TODO validate that a key with the same provider and organization does not exist
        organizationModelProviderKey.setAiModelProvider(modelProvider);

        return organizationModelProviderKeysRepository.save(organizationModelProviderKey);
    }

    public OrganizationModelProviderKey updateModelKey(OrganizationModelProviderKey organizationModelProviderKey) throws GendoxException {
        OrganizationModelProviderKey existingModelKey = getByIdAndOrganizationId(organizationModelProviderKey.getId(), organizationModelProviderKey.getOrganizationId());

        // TODO validate that a key with the same provider and organization does not exist
        AiModelProvider modelProvider = aiModelService.getProviderByName(organizationModelProviderKey.getAiModelProvider().getName()); // Check if AI model provider exists

        existingModelKey.setAiModelProvider(modelProvider);
        existingModelKey.setKey(organizationModelProviderKey.getKey());

        return organizationModelProviderKeysRepository.save(existingModelKey);
    }

    public void deleteModelKey(UUID organizationId, UUID modelKeyId) throws GendoxException {
        OrganizationModelProviderKey existingModelKey = getByIdAndOrganizationId(modelKeyId, organizationId);

        organizationModelProviderKeysRepository.delete(existingModelKey);
    }

    /**
     * Returns the organization key for the agent and the AI model type
     * @param agent
     * @param aiModelType
     * @return
     * @throws GendoxException
     */
    @Nullable
    public OrganizationModelProviderKey getKeyForAgent(ProjectAgent agent, String aiModelType) throws GendoxException {
        AiModel model = null;

        //find the model based on the type
        if ("COMPLETION_MODEL".equals(aiModelType)) {
            model = agent.getCompletionModel();
        } else if ("SEMANTIC_SEARCH_MODEL".equals(aiModelType)) {
            model = agent.getSemanticSearchModel();
        } else if ("MODERATION_MODEL".equals(aiModelType)) {
            model = agent.getModerationModel();
        }

        // find Organization Key
        OrganizationModelProviderKey organizationKey = this.getAllByCriteria(OrganizationModelKeyCriteria.builder()
                        .organizationId(agent.getProject().getOrganizationId())
                        .aiModelProviderName(model.getAiModelProvider().getName())
                        .build(), Pageable.unpaged())
                .stream()
                .findFirst()
                .orElse(null);

        return organizationKey;
    }

    /**
     * Return the Gendox default key for the Agent
     *
     * @param agent
     * @param aiModelType
     * @return
     * @throws GendoxException
     */
    public String getDefaultKeyForAgent(ProjectAgent agent, String aiModelType) throws GendoxException {
        AiModel model = null;

        //find the model based on the type
        if ("COMPLETION_MODEL".equals(aiModelType)) {
            model = agent.getCompletionModel();
        } else if ("SEMANTIC_SEARCH_MODEL".equals(aiModelType)) {
            model = agent.getSemanticSearchModel();
        } else if ("MODERATION_MODEL".equals(aiModelType)) {
            //always the OpenAI Moderation
            return environment.getProperty("gendox.models.open_ai.key");
        }

        String providerKeyProperty = "gendox.models." + model.getAiModelProvider().getName().toLowerCase() + ".key";

        logger.info("Using default provider key: {} - for agent: {}", providerKeyProperty, agent.getId());

        return environment.getProperty(providerKeyProperty);


    }


    @NotNull
    private Page<OrganizationModelProviderKey> hideKeys(Page<OrganizationModelProviderKey> organizationModelKeys) {
        List<OrganizationModelProviderKey> hiddenKeys = organizationModelKeys.stream().map(key -> {
                    OrganizationModelProviderKey hiddenKey = new OrganizationModelProviderKey();
                    hiddenKey.setId(key.getId());
                    hiddenKey.setKey(key.getKey().substring(0, 4) + "*****");
                    hiddenKey.setAiModelProvider(key.getAiModelProvider());
                    hiddenKey.setOrganizationId(key.getOrganizationId());
                    hiddenKey.setCreatedAt(key.getCreatedAt());
                    hiddenKey.setUpdatedAt(key.getUpdatedAt());
                    return hiddenKey;
                })
                .collect(Collectors.toList());

        return new PageImpl<>(hiddenKeys, organizationModelKeys.getPageable(), organizationModelKeys.getTotalElements());
    }
}
