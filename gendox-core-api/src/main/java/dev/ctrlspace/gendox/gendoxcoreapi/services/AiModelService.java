package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModel;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.AiModelRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AiModelService {

    private AiModelRepository aiModelRepository;
    private TypeService typeService;


    @Autowired
    public AiModelService(AiModelRepository aiModelRepository,
                          TypeService typeService) {
        this.aiModelRepository = aiModelRepository;
        this.typeService = typeService;
    }

    public Map<String, List<AiModel>> getAiModels() {

            Map<String, List<AiModel>> aiModelByCategory = new HashMap<>();
            List<String> categories = new ArrayList<>();
            List<Type> types = typeService.getTypeCategories("AI_MODEL_TYPE");

            for(Type type : types) {
                categories.add(type.getName());
            }

            aiModelByCategory = getAiModelByCategory(categories);

            return aiModelByCategory;

    }


    public Map<String, List<AiModel>> getAiModelByCategory(List<String> categories) {

        Map<String, List<AiModel>> aiModelByCategory = new HashMap<>();

        for(String category : categories) {
            Type type = typeService.getAiModelTypeByName(category);
            List<AiModel> aiModels = aiModelRepository.findByAiModelType(type);
            aiModelByCategory.put(category, aiModels);
        }

        return aiModelByCategory;
    }

    public List<AiModel> getAiModelByType(List<String> categories) {
         List<AiModel> aiModels = new ArrayList<>();

            Type type = typeService.getAiModelTypeByName(categories.get(0));
            aiModels = aiModelRepository.findByAiModelType(type);

            return aiModels;

    }


}
