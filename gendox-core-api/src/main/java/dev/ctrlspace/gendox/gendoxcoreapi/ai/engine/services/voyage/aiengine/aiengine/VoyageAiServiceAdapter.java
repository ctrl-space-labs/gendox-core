package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.voyage.aiengine.aiengine;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.converters.VoyageEmbeddingResponseConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.*;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.OpenAiModerationResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.voyage.request.VoyageEmbedRequest;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.voyage.response.VoyageEmbedResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.AiModelApiAdapterService;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.utils.constants.VoyageConfig;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModel;
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

    @Value("${gendox.models.voyage.key}")
    private String voyageKey;

    @Autowired
    public VoyageAiServiceAdapter(RestTemplate restTemplate,
                                  VoyageEmbeddingResponseConverter voyageEmbeddingResponseConverter) {
        this.restTemplate = restTemplate;
        this.voyageEmbeddingResponseConverter = voyageEmbeddingResponseConverter;
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


    @Override
    public EmbeddingResponse askEmbedding(BotRequest botRequest, AiModel aiModel, String apiKey) {
        VoyageEmbedResponse voyageEmbedResponse = this.getEmbeddingResponse((
                        VoyageEmbedRequest.builder()
                                .input(botRequest.getMessages())
                                .model(aiModel.getModel())
                                .build()),
                aiModel,
                apiKey);

        EmbeddingResponse embeddingResponse = voyageEmbeddingResponseConverter.voyagetoEmbeddingResponse(voyageEmbedResponse);
        logger.info("Embedding Response: {}", embeddingResponse);
        return embeddingResponse;

    }

    @Override
    public CompletionResponse askCompletion(List<AiModelMessage> messages, String agentRole, AiModel aiModel, AiModelRequestParams aiModelRequestParams, String apiKey) {
        return null;
    }

    @Override
    public Set<String> getSupportedApiTypeNames() {
        return supportedApiTypeNames;
    }

    @Override
    public ModerationResponse moderationCheck(String message, String apiKey, AiModel aiModel) {
        return null;
    }

    @Override
    public boolean supports(String apiTypeName) {
        return supportedApiTypeNames.contains(apiTypeName);
    }
}
