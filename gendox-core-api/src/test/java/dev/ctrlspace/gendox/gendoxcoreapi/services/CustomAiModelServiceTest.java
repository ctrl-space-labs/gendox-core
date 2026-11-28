package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.AiModelMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.CompletionResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Choice;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.AiModelApiAdapterService;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModel;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModelProvider;
import dev.ctrlspace.gendox.gendoxcoreapi.model.OrganizationModelProviderKey;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.AiModelCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.AiModelProviderCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.AiModelProviderRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.AiModelRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.AiModelUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.ModelEndpointValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.HttpStatus;
import org.springframework.web.client.HttpClientErrorException;

import java.math.BigDecimal;
import java.util.List;
import java.util.function.Predicate;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class CustomAiModelServiceTest {

    private static final UUID ORGANIZATION_ID = UUID.randomUUID();

    private AiModelRepository models;
    private AiModelProviderRepository providers;
    private AiModelService aiModelService;
    private OrganizationModelKeyService keys;
    private AiModelProvider provider;
    private EmbeddingService embeddingService;
    private AiModelApiAdapterService adapter;
    private CustomAiModelService service;

    @BeforeEach
    void setUp() throws GendoxException {
        models = mock(AiModelRepository.class);
        when(models.save(any())).thenAnswer(call -> call.getArgument(0));
        providers = mock(AiModelProviderRepository.class);
        when(providers.save(any())).thenAnswer(call -> call.getArgument(0));
        provider = new AiModelProvider();
        provider.setId(UUID.randomUUID());
        provider.setOrganizationId(ORGANIZATION_ID);
        provider.setName("Our vLLM");
        provider.setBaseUrl("https://8.8.8.8/v1");
        // nothing matches a criteria unless a test says so
        aiModelService = mock(AiModelService.class);
        when(aiModelService.getAllByCriteria(any(), any())).thenReturn(Page.empty());
        when(aiModelService.getAllProvidersByCriteria(any(), any())).thenReturn(Page.empty());
        providersMatching(c -> provider.getId().equals(c.getId()) && ORGANIZATION_ID.equals(c.getOrganizationId()), provider);
        keys = mock(OrganizationModelKeyService.class);
        when(keys.getAllByCriteria(any(), any())).thenReturn(Page.empty());
        TypeService types = mock(TypeService.class);
        when(types.getByCategoryAndName(anyString(), anyString())).thenAnswer(call -> type(call.getArgument(1)));
        embeddingService = mock(EmbeddingService.class);
        adapter = mock(AiModelApiAdapterService.class);
        AiModelUtils adapters = mock(AiModelUtils.class);
        when(adapters.getAiModelApiAdapterImpl(anyString())).thenReturn(adapter);
        when(adapters.askCompletion(any(), any(), any(), any(), any(), any(), any(), any(), any())).thenCallRealMethod();
        when(adapters.askEmbedding(any(), any(), any())).thenCallRealMethod();
        service = new CustomAiModelService(models, providers, aiModelService, keys, types, new ModelEndpointValidator(false), embeddingService, adapters);
    }

    @Test
    void aTestCallsTheModelWithTheOrganizationsKeyAndSavesNothing() throws GendoxException {
        when(embeddingService.getApiKey(eq(ORGANIZATION_ID), any())).thenReturn("own-key");
        CompletionResponse answer = CompletionResponse.builder()
                .choices(List.of(Choice.builder().message(AiModelMessage.builder().content(" OK ").build()).build()))
                .build();
        when(adapter.askCompletion(any(), any(), any(), any(), eq("own-key"), any(), any(), any(), any())).thenReturn(answer);

        CustomAiModelService.ModelTestResult result = service.testModel(ORGANIZATION_ID, request("COMPLETION_MODEL", null));

        assertTrue(result.ok());
        assertEquals("Answered: OK", result.message());
        verify(models, never()).save(any());
    }

    @Test
    void aTestReportsWhatTheServerAnswered() throws GendoxException {
        when(adapter.askEmbedding(any(), any(), any())).thenThrow(HttpClientErrorException.create(
                HttpStatus.UNAUTHORIZED, "Unauthorized", null, "{\"error\":\"bad key\"}".getBytes(), null));

        CustomAiModelService.ModelTestResult result = service.testModel(ORGANIZATION_ID, request("SEMANTIC_SEARCH_MODEL", null));

        assertFalse(result.ok());
        assertEquals("The server answered 401: {\"error\":\"bad key\"}", result.message());
    }

    @Test
    void aProviderInsideTheNetworkOrWithATakenNameIsRefused() {
        AiModelProvider inside = new AiModelProvider();
        inside.setName("Inside");
        inside.setBaseUrl("https://10.0.0.1/v1");
        assertThrows(GendoxException.class, () -> service.createProvider(ORGANIZATION_ID, inside));

        AiModelProvider gendoxProvider = new AiModelProvider();
        gendoxProvider.setId(UUID.randomUUID());
        providersMatching(c -> "OPEN_AI".equals(c.getName()) && c.isIncludeGendoxProviders(), gendoxProvider);
        AiModelProvider clash = new AiModelProvider();
        clash.setName("OPEN_AI");
        clash.setBaseUrl("https://8.8.8.8/v1");
        GendoxException e = assertThrows(GendoxException.class, () -> service.createProvider(ORGANIZATION_ID, clash));
        assertEquals("AI_MODEL_PROVIDER_NAME_TAKEN", e.getErrorCode());
        verify(providers, never()).save(any());
    }

    @Test
    void aNewBaseUrlMovesTheProvidersModels() throws GendoxException {
        AiModel embedder = create("SEMANTIC_SEARCH_MODEL", null);
        modelsMatching(c -> provider.getId().equals(c.getAiModelProviderId()), embedder);
        AiModelProvider request = new AiModelProvider();
        request.setName("Our vLLM");
        request.setBaseUrl("https://1.1.1.1/v2/");

        service.updateProvider(ORGANIZATION_ID, provider.getId(), request);

        assertEquals("https://1.1.1.1/v2/embeddings", embedder.getUrl());
    }

    @Test
    void onlyAProviderWithoutModelsIsDeletedAndItsKeyWithIt() throws GendoxException {
        modelsMatching(c -> provider.getId().equals(c.getAiModelProviderId()), new AiModel());
        GendoxException e = assertThrows(GendoxException.class, () -> service.deleteProvider(ORGANIZATION_ID, provider.getId()));
        assertEquals("AI_MODEL_PROVIDER_IN_USE", e.getErrorCode());
        verify(providers, never()).delete(any());

        modelsMatching(c -> provider.getId().equals(c.getAiModelProviderId()));
        OrganizationModelProviderKey itsKey = new OrganizationModelProviderKey();
        itsKey.setId(UUID.randomUUID());
        when(keys.getAllByCriteria(argThat(c -> c != null && provider.getId().equals(c.getAiModelProviderId())
                && ORGANIZATION_ID.equals(c.getOrganizationId())), any())).thenReturn(new PageImpl<>(List.of(itsKey)));
        service.deleteProvider(ORGANIZATION_ID, provider.getId());
        verify(keys).deleteModelKey(ORGANIZATION_ID, itsKey.getId());
        verify(providers).delete(provider);
    }

    @Test
    void eachModelTypeIsCalledAtItsPathOnItsProviderWithNoCostToGendox() throws GendoxException {
        assertEquals("https://8.8.8.8/v1/chat/completions", create("COMPLETION_MODEL", null).getUrl());
        assertEquals("https://8.8.8.8/v1/responses", create("COMPLETION_MODEL", "OPEN_AI_RESPONSES_API").getUrl());
        assertEquals("https://8.8.8.8/v1/messages", create("COMPLETION_MODEL", "ANTHROPIC_AI_API").getUrl());
        assertEquals("https://8.8.8.8/v1/embeddings", create("SEMANTIC_SEARCH_MODEL", null).getUrl());
        AiModel rerank = create("RERANK_MODEL", null);
        assertEquals("https://8.8.8.8/v1/rerank", rerank.getUrl());
        assertEquals("COHERE_API", rerank.getApiType().getName());
        assertEquals(provider, rerank.getAiModelProvider());
        assertEquals(ORGANIZATION_ID, rerank.getOrganizationId());
        assertEquals("FREE_MODEL", rerank.getModelTierType().getName());
        assertEquals(BigDecimal.ZERO, rerank.getPrice());
    }

    @Test
    void anotherOrganizationsProviderATypeOrAnApiItCannotUseIsRefused() {
        AiModel elsewhere = request("COMPLETION_MODEL", null);
        AiModelProvider theirs = new AiModelProvider();
        theirs.setId(UUID.randomUUID());
        elsewhere.setAiModelProvider(theirs);
        GendoxException e = assertThrows(GendoxException.class, () -> service.createModel(ORGANIZATION_ID, elsewhere));
        assertEquals("AI_MODEL_PROVIDER_NOT_FOUND", e.getErrorCode());
        assertThrows(GendoxException.class, () -> create("SEMANTIC_SEARCH_MODEL", "ANTHROPIC_AI_API"));
        assertThrows(GendoxException.class, () -> create("MODERATION_MODEL", null));
        verify(models, never()).save(any());
    }

    @Test
    void aNameOfGendoxsModelsIsTaken() {
        AiModel gendoxModel = new AiModel();
        gendoxModel.setId(UUID.randomUUID());
        modelsMatching(c -> "our-model".equals(c.getName()) && c.isIncludeGendoxModels(), gendoxModel);
        GendoxException e = assertThrows(GendoxException.class, () -> create("COMPLETION_MODEL", null));
        assertEquals("AI_MODEL_NAME_TAKEN", e.getErrorCode());
    }

    @Test
    void aModelInUseIsNotDeleted() {
        AiModel model = new AiModel();
        model.setId(UUID.randomUUID());
        modelsMatching(c -> model.getId().equals(c.getId()) && ORGANIZATION_ID.equals(c.getOrganizationId()), model);
        doThrow(new DataIntegrityViolationException("fk")).when(models).deleteAllByIdInBatch(List.of(model.getId()));

        GendoxException e = assertThrows(GendoxException.class, () -> service.deleteModel(ORGANIZATION_ID, model.getId()));
        assertEquals("AI_MODEL_IN_USE", e.getErrorCode());
    }

    @Test
    void anOwnModelRunsOnlyOnItsOrganizationsKey() throws GendoxException {
        OrganizationModelKeyService keyService = mock(OrganizationModelKeyService.class);
        EmbeddingService realEmbeddingService = new EmbeddingService(null, null, null, null, null, null, null, null, null,
                null, null, null, keyService, null, null, null, null, null, new ModelEndpointValidator(false));
        AiModel model = create("COMPLETION_MODEL", null);

        // no key: the call goes with an empty one, never with Gendox's
        assertEquals("", realEmbeddingService.getApiKey(ORGANIZATION_ID, model));
        verify(keyService, never()).getDefaultKeyForModel(any(), any());

        OrganizationModelProviderKey key = new OrganizationModelProviderKey();
        key.setKey("own-key");
        when(keyService.getKeyForModel(ORGANIZATION_ID, model)).thenReturn(key);
        assertEquals("own-key", realEmbeddingService.getApiKey(ORGANIZATION_ID, model));

        // another organization cannot use it
        assertThrows(GendoxException.class, () -> realEmbeddingService.getApiKey(UUID.randomUUID(), model));
        // an endpoint that has since moved inside the network is not called
        model.setUrl("https://127.0.0.1/v1/chat/completions");
        assertThrows(GendoxException.class, () -> realEmbeddingService.getApiKey(ORGANIZATION_ID, model));
    }

    private void modelsMatching(Predicate<AiModelCriteria> criteria, AiModel... found) {
        when(aiModelService.getAllByCriteria(argThat(c -> c != null && criteria.test(c)), any())).thenReturn(new PageImpl<>(List.of(found)));
    }

    private void providersMatching(Predicate<AiModelProviderCriteria> criteria, AiModelProvider... found) {
        when(aiModelService.getAllProvidersByCriteria(argThat(c -> c != null && criteria.test(c)), any())).thenReturn(new PageImpl<>(List.of(found)));
    }

    private AiModel create(String type, String apiType) throws GendoxException {
        return service.createModel(ORGANIZATION_ID, request(type, apiType));
    }

    private AiModel request(String type, String apiType) {
        AiModel request = new AiModel();
        request.setName("our-model");
        request.setModel("meta-llama/Llama-3.3-70B-Instruct");
        AiModelProvider onProvider = new AiModelProvider();
        onProvider.setId(provider.getId());
        request.setAiModelProvider(onProvider);
        request.setAiModelType(type(type));
        request.setApiType(apiType == null ? null : type(apiType));
        return request;
    }

    private static Type type(String name) {
        Type type = new Type();
        type.setName(name);
        return type;
    }
}
