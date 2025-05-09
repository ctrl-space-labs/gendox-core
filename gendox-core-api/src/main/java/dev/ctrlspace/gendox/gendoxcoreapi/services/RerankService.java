package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.EmbeddingResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.RerankResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.AiModelApiAdapterService;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModel;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstanceSection;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectAgent;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.AiModelUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RerankService {
    Logger logger = LoggerFactory.getLogger(RerankService.class);

    private AiModelUtils aiModelUtils;
    private EmbeddingService embeddingService;

    @Autowired
    public RerankService(AiModelUtils aiModelUtils,
                         EmbeddingService embeddingService) {
        this.aiModelUtils = aiModelUtils;
        this.embeddingService = embeddingService;
    }

    public List<DocumentInstanceSection> rerankSections(ProjectAgent agent, List<DocumentInstanceSection> sectionList, String query) throws GendoxException {
        AiModel aiModel = agent.getRerankModel();
        String apiKey = embeddingService.getApiKey(agent, "RERANK_MODEL");
        List<String> documents = toDocumentStrings(sectionList);
        RerankResponse rerankResponse = this.rerankList(documents, query, aiModel, apiKey);

        logger.info("Rerank response: {}", rerankResponse);

        return rerankResponse.getResults().stream()
                .map(result -> sectionList.get(result.getIndex()))
                .toList();

    }

    public RerankResponse rerankList(List<String> documents, String query, AiModel aiModel, String apiKey) throws GendoxException {
        AiModelApiAdapterService aiModelApiAdapterService = aiModelUtils.getAiModelApiAdapterImpl(aiModel.getAiModelProvider().getApiType().getName());
        return aiModelApiAdapterService.askRerank(documents, query, aiModel, apiKey);

    }

    private List<String> toDocumentStrings(List<DocumentInstanceSection> sections) {
        return sections.stream()
                .map(DocumentInstanceSection::getSectionValue)
                .toList();
    }

}
