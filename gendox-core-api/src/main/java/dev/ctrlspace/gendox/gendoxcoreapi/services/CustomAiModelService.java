package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.AiModelMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.AiModelRequestParams;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.EmbeddingMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.AiModelApiAdapterService;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModel;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModelProvider;
import dev.ctrlspace.gendox.gendoxcoreapi.model.OrganizationModelProviderKey;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.AiModelCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.AiModelProviderCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.OrganizationModelKeyCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.AiModelProviderRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.AiModelRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.AiModelUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.ModelEndpointValidator;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientResponseException;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * The providers an organization adds itself, each an endpoint (base URL) with the organization's model key for it,
 * and the models on them: ai_model_providers and ai_models rows with its organization id. Each model is called at
 * its provider's base URL plus the path of its API type, by the existing adapter of that API type.
 */
@Service
public class CustomAiModelService {

    // per model type, the API types it may use and the path each adds to the provider's base URL
    static final Map<String, Map<String, String>> PATHS = Map.of(
            "COMPLETION_MODEL", Map.of(
                    "OPEN_AI_API", "/chat/completions",
                    "OPEN_AI_RESPONSES_API", "/responses",
                    "ANTHROPIC_AI_API", "/messages"),
            "SEMANTIC_SEARCH_MODEL", Map.of("OPEN_AI_API", "/embeddings"),
            "RERANK_MODEL", Map.of("COHERE_API", "/rerank"));

    private final AiModelRepository aiModelRepository;
    private final AiModelProviderRepository aiModelProviderRepository;
    private final AiModelService aiModelService;
    private final OrganizationModelKeyService organizationModelKeyService;
    private final TypeService typeService;
    private final ModelEndpointValidator modelEndpointValidator;
    private final EmbeddingService embeddingService;
    private final AiModelUtils aiModelUtils;

    public CustomAiModelService(AiModelRepository aiModelRepository,
                                AiModelProviderRepository aiModelProviderRepository,
                                AiModelService aiModelService,
                                OrganizationModelKeyService organizationModelKeyService,
                                TypeService typeService,
                                ModelEndpointValidator modelEndpointValidator,
                                EmbeddingService embeddingService,
                                AiModelUtils aiModelUtils) {
        this.aiModelRepository = aiModelRepository;
        this.aiModelProviderRepository = aiModelProviderRepository;
        this.aiModelService = aiModelService;
        this.organizationModelKeyService = organizationModelKeyService;
        this.typeService = typeService;
        this.modelEndpointValidator = modelEndpointValidator;
        this.embeddingService = embeddingService;
        this.aiModelUtils = aiModelUtils;
    }

    // ---- providers

    public AiModelProvider createProvider(UUID organizationId, AiModelProvider request) throws GendoxException {
        AiModelProvider provider = new AiModelProvider();
        provider.setOrganizationId(organizationId);
        // each model chooses its own API type; this only fills the column
        provider.setApiType(typeService.getByCategoryAndName("AI_MODEL_API_TYPE", "OPEN_AI_API"));
        provider.setCreatedAt(Instant.now());
        applyEditableFields(provider, request);
        requireFreeProviderName(organizationId, provider.getName(), null);
        return aiModelProviderRepository.save(provider);
    }

    /**
     * A new base URL moves all the provider's models to it.
     */
    @Transactional
    public AiModelProvider updateProvider(UUID organizationId, UUID providerId, AiModelProvider request) throws GendoxException {
        AiModelProvider provider = getProvider(organizationId, providerId);
        applyEditableFields(provider, request);
        requireFreeProviderName(organizationId, provider.getName(), providerId);
        for (AiModel model : modelsOn(providerId)) {
            model.setUrl(provider.getBaseUrl() + PATHS.get(model.getAiModelType().getName()).get(model.getApiType().getName()));
            aiModelRepository.save(model);
        }
        return aiModelProviderRepository.save(provider);
    }

    /**
     * Only a provider without models can be deleted; its key goes with it.
     */
    @Transactional
    public void deleteProvider(UUID organizationId, UUID providerId) throws GendoxException {
        AiModelProvider provider = getProvider(organizationId, providerId);
        if (!modelsOn(providerId).isEmpty()) {
            throw new GendoxException("AI_MODEL_PROVIDER_IN_USE", "Delete the server's models first", HttpStatus.CONFLICT);
        }
        for (OrganizationModelProviderKey key : organizationModelKeyService.getAllByCriteria(OrganizationModelKeyCriteria.builder()
                .organizationId(organizationId)
                .aiModelProviderId(providerId)
                .build(), Pageable.unpaged())) {
            organizationModelKeyService.deleteModelKey(organizationId, key.getId());
        }
        aiModelProviderRepository.delete(provider);
    }

    private AiModelProvider getProvider(UUID organizationId, UUID providerId) throws GendoxException {
        return aiModelService.getAllProvidersByCriteria(AiModelProviderCriteria.builder()
                        .id(providerId)
                        .organizationId(organizationId)
                        .build(), Pageable.unpaged())
                .stream()
                .findFirst()
                .orElseThrow(() -> new GendoxException("AI_MODEL_PROVIDER_NOT_FOUND", "Server not found", HttpStatus.NOT_FOUND));
    }

    private void applyEditableFields(AiModelProvider provider, AiModelProvider request) throws GendoxException {
        provider.setName(requireText(request.getName(), "name"));
        provider.setDescription(request.getDescription() == null ? "" : shorten(request.getDescription().strip(), 1000));
        provider.setBaseUrl(modelEndpointValidator.normalizeBaseUrl(request.getBaseUrl()));
        provider.setUpdatedAt(Instant.now());
    }

    // unique among Gendox's providers and the organization's own: keys find their provider by name
    private void requireFreeProviderName(UUID organizationId, String name, UUID providerId) throws GendoxException {
        boolean taken = aiModelService.getAllProvidersByCriteria(AiModelProviderCriteria.builder()
                        .name(name)
                        .organizationId(organizationId)
                        .includeGendoxProviders(true)
                        .build(), Pageable.unpaged())
                .stream()
                .anyMatch(other -> !other.getId().equals(providerId));
        if (taken) {
            throw new GendoxException("AI_MODEL_PROVIDER_NAME_TAKEN", "A server with this name already exists", HttpStatus.CONFLICT);
        }
    }

    // ---- models

    public List<AiModel> getModels(UUID organizationId) {
        return aiModelService.getAllByCriteria(AiModelCriteria.builder().organizationId(organizationId).build(),
                Pageable.unpaged(Sort.by("name"))).getContent();
    }

    private AiModel getModel(UUID organizationId, UUID modelId) throws GendoxException {
        return aiModelService.getAllByCriteria(AiModelCriteria.builder().id(modelId).organizationId(organizationId).build(), Pageable.unpaged())
                .stream()
                .findFirst()
                .orElseThrow(() -> new GendoxException("AI_MODEL_NOT_FOUND", "AI Model not found", HttpStatus.NOT_FOUND));
    }

    private List<AiModel> modelsOn(UUID providerId) {
        return aiModelService.getAllByCriteria(AiModelCriteria.builder().aiModelProviderId(providerId).build(), Pageable.unpaged()).getContent();
    }

    public AiModel createModel(UUID organizationId, AiModel request) throws GendoxException {
        AiModel model = newModel(organizationId, request);
        requireFreeName(organizationId, model.getName(), null);
        return aiModelRepository.save(model);
    }

    public AiModel updateModel(UUID organizationId, UUID modelId, AiModel request) throws GendoxException {
        AiModel model = getModel(organizationId, modelId);
        // the type stays: the agents and embeddings that use the model depend on it
        applyEditableFields(model, request);
        requireFreeName(organizationId, model.getName(), modelId);
        return aiModelRepository.save(model);
    }

    /**
     * A model an agent, a task or an embedding still uses cannot be deleted; it can be deactivated instead.
     */
    public void deleteModel(UUID organizationId, UUID modelId) throws GendoxException {
        AiModel model = getModel(organizationId, modelId);
        try {
            aiModelRepository.deleteAllByIdInBatch(List.of(model.getId()));
        } catch (DataIntegrityViolationException e) {
            throw new GendoxException("AI_MODEL_IN_USE", "The model is in use; deactivate it instead", HttpStatus.CONFLICT);
        }
    }

    // ---- tests

    /**
     * Tests a model before it is saved: one small request, a question to a chat model, a sentence to an embedding
     * model, two passages to a reranker, with the key and endpoint check of every later call. Nothing is stored; the
     * answer is summed up, not returned.
     */
    public ModelTestResult testModel(UUID organizationId, AiModel request) throws GendoxException {
        AiModel model = newModel(organizationId, request);
        String apiKey = embeddingService.getApiKey(organizationId, model);
        AiModelApiAdapterService adapter = aiModelUtils.getAiModelApiAdapterImpl(model.getApiType().getName());

        long start = System.currentTimeMillis();
        try {
            String summary = switch (model.getAiModelType().getName()) {
                case "COMPLETION_MODEL" -> {
                    String text = adapter.askCompletion(
                                    new ArrayList<>(List.of(AiModelMessage.builder().role("user").content("Reply with the word OK.").build())),
                                    "You are answering a connection test.", model,
                                    AiModelRequestParams.builder().maxTokens(256L).build(), apiKey, List.of(), null, null)
                            .getChoices().getFirst().getMessage().getContent();
                    yield "Answered: " + shorten(text == null ? "" : text.strip(), 80);
                }
                case "SEMANTIC_SEARCH_MODEL" -> "Returned a vector of " + adapter.askEmbedding(
                                EmbeddingMessage.builder().messages(List.of("A connection test.")).build(), model, apiKey)
                        .getData().getFirst().getEmbedding().size() + " dimensions";
                default -> "Ranked " + adapter.askRerank(
                                List.of("The sky is blue.", "Grass is green."), "What colour is the sky?", model, apiKey)
                        .getResults().size() + " passages";
            };
            return new ModelTestResult(true, summary, System.currentTimeMillis() - start);
        } catch (RestClientResponseException e) {
            String body = e.getResponseBodyAsString().strip();
            return new ModelTestResult(false, "The server answered " + e.getStatusCode().value()
                    + (body.isEmpty() ? "" : ": " + shorten(body, 200)), System.currentTimeMillis() - start);
        } catch (ResourceAccessException e) {
            return new ModelTestResult(false, "Could not reach the server", System.currentTimeMillis() - start);
        } catch (RuntimeException e) {
            return new ModelTestResult(false, "The server's answer could not be read", System.currentTimeMillis() - start);
        }
    }

    public record ModelTestResult(boolean ok, String message, long millis) {
    }

    // A model of the organization, from the fields a request may set; not saved
    private AiModel newModel(UUID organizationId, AiModel request) throws GendoxException {
        String type = request.getAiModelType() == null ? null : request.getAiModelType().getName();
        if (type == null || !PATHS.containsKey(type)) {
            throw invalid("The model type must be one of " + PATHS.keySet());
        }
        AiModel model = new AiModel();
        model.setOrganizationId(organizationId);
        model.setAiModelType(typeService.getByCategoryAndName("AI_MODEL_TYPE", type));
        // Gendox does not pay for the organization's own models, so every plan can use them
        model.setModelTierType(typeService.getByCategoryAndName("MODEL_TIER", "FREE_MODEL"));
        model.setPrice(BigDecimal.ZERO);
        model.setSystemRoleName("system");
        applyEditableFields(model, request);
        return model;
    }

    private void applyEditableFields(AiModel model, AiModel request) throws GendoxException {
        String type = model.getAiModelType().getName();
        String apiType = request.getApiType() == null || request.getApiType().getName() == null
                ? ("RERANK_MODEL".equals(type) ? "COHERE_API" : "OPEN_AI_API")
                : request.getApiType().getName();
        String path = PATHS.get(type).get(apiType);
        if (path == null) {
            throw invalid("A " + type + " can use the API types " + PATHS.get(type).keySet());
        }
        // on one of the organization's own providers; when updating, the one it is on unless the request names another
        UUID providerId = request.getAiModelProvider() == null ? null : request.getAiModelProvider().getId();
        if (providerId != null) {
            model.setAiModelProvider(getProvider(model.getOrganizationId(), providerId));
        } else if (model.getAiModelProvider() == null) {
            throw invalid("Choose the server the model runs on");
        }
        model.setApiType(typeService.getByCategoryAndName("AI_MODEL_API_TYPE", apiType));
        model.setUrl(model.getAiModelProvider().getBaseUrl() + path);
        model.setModel(requireText(request.getModel(), "model"));
        model.setName(requireText(request.getName() == null || request.getName().isBlank() ? request.getModel() : request.getName(), "name"));
        model.setDescription(request.getDescription() == null ? "" : shorten(request.getDescription().strip(), 1000));
        model.setSupportsReasoning(request.getSupportsReasoning());
        model.setSupportsSamplingParams(request.getSupportsSamplingParams());
        model.setIsActive(!Boolean.FALSE.equals(request.getIsActive()));
    }

    // unique among Gendox's models and the organization's own
    private void requireFreeName(UUID organizationId, String name, UUID modelId) throws GendoxException {
        boolean taken = aiModelService.getAllByCriteria(AiModelCriteria.builder()
                        .name(name)
                        .organizationId(organizationId)
                        .includeGendoxModels(true)
                        .build(), Pageable.unpaged())
                .stream()
                .anyMatch(other -> !other.getId().equals(modelId));
        if (taken) {
            throw new GendoxException("AI_MODEL_NAME_TAKEN", "A model with this name already exists", HttpStatus.CONFLICT);
        }
    }

    private String requireText(String value, String field) throws GendoxException {
        if (value == null || value.isBlank()) {
            throw invalid("The " + field + " is required");
        }
        if (value.strip().length() > 256) {
            throw invalid("The " + field + " is longer than 256 characters");
        }
        return value.strip();
    }

    private static String shorten(String value, int length) {
        return value.length() <= length ? value : value.substring(0, length) + "…";
    }

    private GendoxException invalid(String message) {
        return new GendoxException("INVALID_AI_MODEL", message, HttpStatus.BAD_REQUEST);
    }
}
