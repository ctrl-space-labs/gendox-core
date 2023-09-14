package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request.BotRequest;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Ada2Response;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.openai.aiengine.aiengine.AiModelService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
public class EmbeddingsController {

    @Autowired
    private AiModelService aiModelService;

    @PostMapping("/embeddings")
    public Ada2Response getEmbeddings(@RequestBody BotRequest botRequest) {
        Ada2Response ada2Response = aiModelService.askEmbedding(botRequest);
        return ada2Response;
    }

}
