package dev.ctrlspace.gendox.gendoxcoreapi.utils;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.AiModelApiAdapterService;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.DecisionModelApiAdapter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class AiModelUtils {

    @Autowired
    private List<AiModelApiAdapterService> aiModelApiAdapterServices;

    @Autowired
    private List<DecisionModelApiAdapter> decisionModelApiAdapters;

    public AiModelApiAdapterService getAiModelApiAdapterImpl(String apiTypeName) throws GendoxException {
        for (AiModelApiAdapterService aiModelApiAdapterService : aiModelApiAdapterServices) {
            if (aiModelApiAdapterService.supports(apiTypeName)){
                return aiModelApiAdapterService;
            }
        }
        throw new GendoxException("MODEL_NOT_SUPPORTED", "Model not supported", HttpStatus.BAD_REQUEST);
    }

    public DecisionModelApiAdapter getDecisionModelApiAdapterImpl(String apiTypeName) throws GendoxException {
        for (DecisionModelApiAdapter adapter : decisionModelApiAdapters) {
            if (adapter.supports(apiTypeName)) {
                return adapter;
            }
        }
        throw new GendoxException("DECISION_MODEL_NOT_SUPPORTED", "Decision model not supported", HttpStatus.BAD_REQUEST);
    }
}
