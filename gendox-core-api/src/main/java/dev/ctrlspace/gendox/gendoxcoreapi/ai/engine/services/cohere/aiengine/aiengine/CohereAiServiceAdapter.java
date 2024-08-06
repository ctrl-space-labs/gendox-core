package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.cohere.aiengine.aiengine;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.*;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.cohere.request.CohereCommandRequest;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.cohere.request.CohereEmbedMultilingualRequest;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.cohere.response.CohereCommandResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.cohere.response.CohereEmbedMultilingualResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.*;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.AiModelApiAdapterService;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.utils.constants.CohereConfig;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.CohereCompletionResponseConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.CohereEmbeddingResponseConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModel;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.AiModelRepository;
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
public class CohereAiServiceAdapter implements AiModelApiAdapterService {

    Logger logger = LoggerFactory.getLogger(CohereAiServiceAdapter.class);

    private Set<String> supportedApiTypeNames = Set.of("COHERE_API");


    private AiModelRepository aiModelRepository;

    private CohereCompletionResponseConverter cohereCompletionResponseConverter;
    private RestTemplate restTemplate;

    private CohereEmbeddingResponseConverter cohereEmbeddingResponseConverter;
    @Value("${gendox.models.cohere.key}")
    private String coherekey;


    @Autowired
    public CohereAiServiceAdapter(AiModelRepository aiModelRepository,
                                  CohereCompletionResponseConverter cohereCompletionResponseConverter,
                                  CohereEmbeddingResponseConverter cohereEmbeddingResponseConverter,
                                  RestTemplate restTemplate){
        this.aiModelRepository = aiModelRepository;
        this.cohereEmbeddingResponseConverter = cohereEmbeddingResponseConverter;
        this.cohereCompletionResponseConverter = cohereCompletionResponseConverter;
        this.restTemplate = restTemplate;
    }

    private HttpHeaders buildHeader() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(CohereConfig.MEDIA_TYPE));
        headers.add(CohereConfig.AUTHORIZATION, CohereConfig.BEARER + coherekey);

        return headers;
    }

    public String getApiEndpointByAiModel(String model) {
        return aiModelRepository.findUrlByModel(model);
    }


    public CohereEmbedMultilingualResponse getEmbeddingResponse(CohereEmbedMultilingualRequest embeddingRequestHttpEntity, AiModel aiModel, String apiKey) {
        String embeddingsApiUrl = aiModel.getUrl();
        logger.debug("Sending Embedding Request to '{}': {}", embeddingsApiUrl, embeddingRequestHttpEntity);
        ResponseEntity<CohereEmbedMultilingualResponse> responseEntity = restTemplate.postForEntity(
                embeddingsApiUrl,
                new HttpEntity<>(embeddingRequestHttpEntity, buildHeader()),
                CohereEmbedMultilingualResponse.class);
        logger.info("Received Embedding Response from '{}'. Tokens billed: {}", embeddingsApiUrl,
                responseEntity.getBody().getMeta().getBilledUnits().getInputTokens() + responseEntity.getBody().getMeta().getBilledUnits().getOutputTokens());

        return responseEntity.getBody();
    }


    public CohereCommandResponse getCompletionResponse(CohereCommandRequest chatRequestHttpEntity, AiModel aiModel, String apiKey) {
        String completionApiUrl = aiModel.getUrl();
        logger.debug("Sending completion Request to '{}': {}", completionApiUrl, chatRequestHttpEntity);
        ResponseEntity<CohereCommandResponse> responseEntity = restTemplate.postForEntity(
                completionApiUrl,
                new HttpEntity<>(chatRequestHttpEntity, buildHeader()),
                CohereCommandResponse.class);
        logger.info("Received completion Response from '{}'. Tokens billed: {}", completionApiUrl,
                responseEntity.getBody().getMeta().getBilledUnits().getInputTokens() + responseEntity.getBody().getMeta().getBilledUnits().getOutputTokens());

        return responseEntity.getBody();
    }



    public EmbeddingResponse askEmbedding(BotRequest botRequest, AiModel aiModel, String apiKey) {
        CohereEmbedMultilingualResponse cohereEmbedMultilingualResponse = this.getEmbeddingResponse((CohereEmbedMultilingualRequest.builder()
                .model(aiModel.getModel())
                .texts(botRequest.getMessages())
                .input_type("search-document")
                .build()),
                aiModel,
                apiKey);

        EmbeddingResponse embeddingResponse = cohereEmbeddingResponseConverter.coheretoEmbeddingResponse(cohereEmbedMultilingualResponse, aiModel);

        return embeddingResponse;

    }

    @Override
    public CompletionResponse askCompletion(List<AiModelMessage> messages, String agentRole, AiModel aiModel, AiModelRequestParams aiModelRequestParams, String apiKey) {


        AiModelMessage message = messages.get(0);
        StringBuilder sb = new StringBuilder();

        sb.append(message.getRole())
                .append("\n\n")
                .append(message.getContent());

        String inputString = sb.toString();

        CohereCommandResponse cohereCommandResponse = this.getCompletionResponse((CohereCommandRequest.builder()
                .model(aiModel.getModel())
                .temperature(aiModelRequestParams.getTemperature())
                .topP(aiModelRequestParams.getTopP())
                .k(aiModelRequestParams.getK())
                .maxTokens(aiModelRequestParams.getMaxTokens())
                .prompt(inputString).build()),
                aiModel,
                apiKey);

        CompletionResponse completionResponse = cohereCompletionResponseConverter.toCompletionResponse(cohereCommandResponse);

        return completionResponse;
    }

    @Override
    public OpenAiGpt35ModerationResponse moderationCheck(String message, String apiKey) {
        return null;
    }


    @Override
    public boolean supports(String apiTypeName) {
        return supportedApiTypeNames.contains(apiTypeName);
    }



    @Override
    public Set<String> getSupportedApiTypeNames() {
        return supportedApiTypeNames;
    }
}
