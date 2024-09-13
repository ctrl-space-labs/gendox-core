package dev.ctrlspace.gendox.gendoxcoreapi.utils;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.AiModelApiAdapterService;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class AiModelUtils {

    @Autowired
    private List<AiModelApiAdapterService> aiModelApiAdapterServices;

    public AiModelApiAdapterService getAiModelApiAdapterImpl(String apiTypeName) throws GendoxException {
        for (AiModelApiAdapterService aiModelApiAdapterService : aiModelApiAdapterServices) {
            if (aiModelApiAdapterService.supports(apiTypeName)){
                return aiModelApiAdapterService;
            }
        }
        throw new GendoxException("MODEL_NOT_SUPPORTED", "Model not supported", HttpStatus.BAD_REQUEST);
    }
}
