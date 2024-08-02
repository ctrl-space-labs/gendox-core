package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModel;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.AiModelRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class AiModelService {

    private AiModelRepository aiModelRepository;



    @Autowired
    public AiModelService(AiModelRepository aiModelRepository) {
        this.aiModelRepository = aiModelRepository;

    }

    public List<AiModel> getAllAiModelsByOrganizationId(UUID organizationId) {
        return aiModelRepository.findAllModelsByOrganizationId(organizationId);
    }


    public AiModel getByName(String modelName) {
        return aiModelRepository.findByName(modelName);
    }
}
