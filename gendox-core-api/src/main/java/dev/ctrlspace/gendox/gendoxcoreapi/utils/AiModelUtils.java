package dev.ctrlspace.gendox.gendoxcoreapi.utils;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.AiModelTypeService;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class AiModelUtils {

    @Autowired
    private List<AiModelTypeService> aiModelTypeServices;

    public AiModelTypeService getAiModelServiceImplementation(AiModel model) throws GendoxException {
        for (AiModelTypeService aiModelTypeService : aiModelTypeServices) {
            if (aiModelTypeService.supports(model)){
                return aiModelTypeService;
            }
        }
        throw new GendoxException("MODEL_NOT_SUPPORTED", "Model not supported", HttpStatus.BAD_REQUEST);
    }
}
