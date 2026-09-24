package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.decision.DecisionRequest;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.decision.DecisionResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModel;
import dev.ctrlspace.gendox.gendoxcoreapi.model.OrganizationModelProviderKey;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectAgent;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.AiModelUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class DecisionService {
    private final AiModelUtils aiModelUtils;
    private final OrganizationModelKeyService modelKeyService;

    public DecisionService(AiModelUtils aiModelUtils, OrganizationModelKeyService modelKeyService) {
        this.aiModelUtils = aiModelUtils;
        this.modelKeyService = modelKeyService;
    }

    /** Shared entry point for document insights and a future LLM decision tool. */
    public DecisionResponse evaluate(ProjectAgent agent, DecisionRequest request) throws GendoxException {
        AiModel model = agent.getDecisionModel();
        if (model == null) {
            throw new GendoxException("DECISION_MODEL_NOT_CONFIGURED", "No decision model is configured for this agent", HttpStatus.BAD_REQUEST);
        }
        OrganizationModelProviderKey organizationKey = modelKeyService.getKeyForAgent(agent, "DECISION_MODEL");
        String apiKey = organizationKey != null
                ? organizationKey.getKey()
                : modelKeyService.getDefaultKeyForAgent(agent, "DECISION_MODEL");
        return aiModelUtils.getDecisionModelApiAdapterImpl(model.getApiType().getName())
                .evaluate(request, model, apiKey);
    }
}
