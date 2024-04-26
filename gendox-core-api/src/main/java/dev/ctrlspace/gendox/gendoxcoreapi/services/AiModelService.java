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



    @Autowired
    public AiModelService(AiModelRepository aiModelRepository) {
        this.aiModelRepository = aiModelRepository;

    }

    public List<AiModel> getAllAiModels() {
        return aiModelRepository.findAll();
    }




}
