package dev.ctrlspace.gendox.gendoxcoreapi.utils;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.openai.aiengine.aiengine.AiModelService;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;

import java.util.List;

public class AiModelUtils {
    private List<AiModelService> aiModelServices;

    public AiModelService getAiModelServiceImplementation(String model) throws GendoxException {
        for (AiModelService aiModelService : aiModelServices) {
            if (aiModelService.supports(model)){
                return aiModelService;
            }
        }
        throw new GendoxException("MODEL_NOT_SUPPORTED", "Model not supported", HttpStatus.BAD_REQUEST);
    }
}
