package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.voyage.aiengine.aiengine;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.converters.VoyageEmbeddingResponseConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.converters.VoyageRerankResponseConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.*;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.voyage.request.VoyageEmbedRequest;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.voyage.request.VoyageRerankRequest;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.voyage.response.VoyageEmbedResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.voyage.response.VoyageRerankResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.AiModelApiAdapterService;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.utils.constants.VoyageConfig;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModel;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiTools;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Set;

@Service
public class VoyageAiServiceAdapter implements AiModelApiAdapterService {
    Logger logger = LoggerFactory.getLogger(VoyageAiServiceAdapter.class);
    private Set<String> supportedApiTypeNames = Set.of("VOYAGE_AI_API");
    private RestTemplate restTemplate;
    private VoyageEmbeddingResponseConverter voyageEmbeddingResponseConverter;
    private VoyageRerankResponseConverter voyageRerankResponseConverter;

    @Value("${gendox.models.voyage.key}")
    private String voyageKey;

    @Autowired
    public VoyageAiServiceAdapter(RestTemplate restTemplate,
                                  VoyageEmbeddingResponseConverter voyageEmbeddingResponseConverter,
                                  VoyageRerankResponseConverter voyageRerankResponseConverter) {

        this.restTemplate = restTemplate;
        this.voyageEmbeddingResponseConverter = voyageEmbeddingResponseConverter;
        this.voyageRerankResponseConverter = voyageRerankResponseConverter;
    }

    private HttpHeaders buildHeader() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(VoyageConfig.MEDIA_TYPE));
        headers.add(VoyageConfig.AUTHORIZATION, VoyageConfig.BEARER + voyageKey);
        return headers;
    }

    public VoyageEmbedResponse getEmbeddingResponse(VoyageEmbedRequest embeddingRequestHttpEntity, AiModel aiModel, String apiKey) {
        String embeddingsApiUrl = aiModel.getUrl();
        logger.debug("Sending Embedding Request to '{}': {}", embeddingsApiUrl, embeddingRequestHttpEntity);
        logger.info("AiModel for Embeddings-->: {}", aiModel.getModel());
        ResponseEntity<VoyageEmbedResponse> response = restTemplate.postForEntity(
                embeddingsApiUrl,
                new HttpEntity<>(embeddingRequestHttpEntity, buildHeader()),
                VoyageEmbedResponse.class);
        logger.info("Received Embedding Response from '{}'. Tokens billed: {}", embeddingsApiUrl,
                response.getBody().getUsage().getTotalTokens());

        return response.getBody();
    }

    public VoyageRerankResponse getRerankResponse (VoyageRerankRequest rerankRequestHttpEntity, AiModel aiModel) {
        String rerankApiUrl = aiModel.getUrl();
        logger.debug("Sending Rerank Request to '{}': {}", rerankApiUrl, rerankRequestHttpEntity);
        logger.info("AiModel for Rerank-->: {}", aiModel.getModel());
        ResponseEntity<VoyageRerankResponse> response = restTemplate.postForEntity(
                rerankApiUrl,
                new HttpEntity<>(rerankRequestHttpEntity, buildHeader()),
                VoyageRerankResponse.class);
        logger.info("Received Rerank Response from '{}'. Tokens billed: {}", rerankApiUrl,
                response.getBody().getUsage().getTotal_tokens());

        return response.getBody();
    }


    @Override
    public EmbeddingResponse askEmbedding(EmbeddingMessage embeddingMessage, AiModel aiModel, String apiKey) {
        VoyageEmbedResponse voyageEmbedResponse = this.getEmbeddingResponse((
                        VoyageEmbedRequest.builder()
                                .input(embeddingMessage.getMessages())
                                .model(aiModel.getModel())
                                .build()),
                aiModel,
                apiKey);

        EmbeddingResponse embeddingResponse = voyageEmbeddingResponseConverter.voyagetoEmbeddingResponse(voyageEmbedResponse);
        logger.info("Embedding Response: {}", embeddingResponse);
        return embeddingResponse;

    }

    @Override
    public CompletionResponse askCompletion(List<AiModelMessage> messages, String agentRole, AiModel aiModel, AiModelRequestParams aiModelRequestParams, String apiKey, List<AiTools> tools) {
        return null;
    }

    @Override
    public Set<String> getSupportedApiTypeNames() {
        return supportedApiTypeNames;
    }

    @Override
    public ModerationResponse askModeration(String message, String apiKey, AiModel aiModel) {
        return null;
    }

    @Override
    public RerankResponse askRerank(List<String> documents, String query, AiModel aiModel, String apiKey) {
        VoyageRerankResponse voyageRerankResponse = this.getRerankResponse((
                        VoyageRerankRequest.builder()
                                .query(query)
                                .documents(documents)
                                .model(aiModel.getModel())
                                .build()),
                aiModel);
        return  voyageRerankResponseConverter.toRerankResponse(voyageRerankResponse);
    }

    @Override
    public boolean supports(String apiTypeName) {
        return supportedApiTypeNames.contains(apiTypeName);
    }
}
