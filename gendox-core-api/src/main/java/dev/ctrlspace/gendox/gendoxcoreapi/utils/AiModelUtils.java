package dev.ctrlspace.gendox.gendoxcoreapi.utils;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.AiModelService;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class AiModelUtils {

    @Autowired
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
