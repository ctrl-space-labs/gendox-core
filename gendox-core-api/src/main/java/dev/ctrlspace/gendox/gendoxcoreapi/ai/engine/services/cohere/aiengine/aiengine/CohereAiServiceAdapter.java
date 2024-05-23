package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.cohere.aiengine.aiengine;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.*;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.cohere.request.CohereCommandRequest;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.cohere.request.CohereEmbedMultilingualRequest;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.cohere.response.CohereCommandResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.cohere.response.CohereEmbedMultilingualResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.*;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.AiModelTypeService;
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
public class CohereAiServiceAdapter implements AiModelTypeService {

    Logger logger = LoggerFactory.getLogger(CohereAiServiceAdapter.class);

    private Set<String> supportedModels = Set.of("COHERE_COMMAND", "COHERE_EMBED_MULTILINGUAL_V3.0");

    private String serviceName = "Cohere";

    private AiModelRepository aiModelRepository;

    private CohereCompletionResponseConverter cohereCompletionResponseConverter;

    private CohereEmbeddingResponseConverter cohereEmbeddingResponseConverter;
    @Value("${gendox.models.cohere.key}")
    private String coherekey;


    @Autowired
    public CohereAiServiceAdapter(AiModelRepository aiModelRepository,
                                  CohereCompletionResponseConverter cohereCompletionResponseConverter,
                                  CohereEmbeddingResponseConverter cohereEmbeddingResponseConverter){
        this.aiModelRepository = aiModelRepository;
        this.cohereEmbeddingResponseConverter = cohereEmbeddingResponseConverter;
        this.cohereCompletionResponseConverter = cohereCompletionResponseConverter;
    }

    private static final RestTemplate restTemplate = new RestTemplate();

    private HttpHeaders buildHeader() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(CohereConfig.MEDIA_TYPE));
        headers.add(CohereConfig.AUTHORIZATION, CohereConfig.BEARER + coherekey);

        return headers;
    }

    public String getApiEndpointByAiModel(String model) {
        return aiModelRepository.findUrlByModel(model);
    }


    public CohereEmbedMultilingualResponse getEmbeddingResponse(CohereEmbedMultilingualRequest embeddingRequestHttpEntity, String aiModelName) {
        String embeddingsApiUrl = getApiEndpointByAiModel(aiModelName);
        logger.debug("Sending Embedding Request to {}: {}", this.getServiceName(), embeddingRequestHttpEntity);
        ResponseEntity<CohereEmbedMultilingualResponse> responseEntity = restTemplate.postForEntity(
                embeddingsApiUrl,
                new HttpEntity<>(embeddingRequestHttpEntity, buildHeader()),
                CohereEmbedMultilingualResponse.class);
        logger.info("Received Embedding Response from {}. Tokens billed: {}", this.getServiceName(),
                responseEntity.getBody().getMeta().getBilledUnits().getInputTokens() + responseEntity.getBody().getMeta().getBilledUnits().getOutputTokens());

        return responseEntity.getBody();
    }


    public CohereCommandResponse getCompletionResponse(CohereCommandRequest chatRequestHttpEntity, String aiModelName) {
        String completionApiUrl = getApiEndpointByAiModel(aiModelName);
        logger.debug("Sending completion Request to {}: {}", this.getServiceName(), chatRequestHttpEntity);
        ResponseEntity<CohereCommandResponse> responseEntity = restTemplate.postForEntity(
                completionApiUrl,
                new HttpEntity<>(chatRequestHttpEntity, buildHeader()),
                CohereCommandResponse.class);
        logger.info("Received completion Response from {}. Tokens billed: {}", this.getServiceName(),
                responseEntity.getBody().getMeta().getBilledUnits().getInputTokens() + responseEntity.getBody().getMeta().getBilledUnits().getOutputTokens());

        return responseEntity.getBody();
    }



    public EmbeddingResponse askEmbedding(BotRequest botRequest, String aiModelName) {
        CohereEmbedMultilingualResponse cohereEmbedMultilingualResponse = this.getEmbeddingResponse((CohereEmbedMultilingualRequest.builder()
                .model(aiModelName)
                .texts(botRequest.getMessages())
                .input_type("search-document")
                .build()),
                aiModelName);

        EmbeddingResponse embeddingResponse = cohereEmbeddingResponseConverter.coheretoEmbeddingResponse(cohereEmbedMultilingualResponse, aiModelName);

        return embeddingResponse;

    }

    @Override
    public CompletionResponse askCompletion(List<AiModelMessage> messages, String agentRole, String aiModelName, AiModelRequestParams aiModelRequestParams) {


        AiModelMessage message = messages.get(0);
        StringBuilder sb = new StringBuilder();

        sb.append(message.getRole())
                .append("\n\n")
                .append(message.getContent());

        String inputString = sb.toString();

        CohereCommandResponse cohereCommandResponse = this.getCompletionResponse((CohereCommandRequest.builder()
                .model(aiModelName)
                .temperature(aiModelRequestParams.getTemperature())
                .topP(aiModelRequestParams.getTopP())
                .k(aiModelRequestParams.getK())
                .maxTokens(aiModelRequestParams.getMaxTokens())
                .prompt(inputString).build()),
                aiModelName);

        CompletionResponse completionResponse = cohereCompletionResponseConverter.toCompletionResponse(cohereCommandResponse);

        return completionResponse;
    }

    @Override
    public OpenAiGpt35ModerationResponse moderationCheck(String message) {
        return null;
    }


    @Override
    public boolean supports(AiModel model) {
        return supportedModels.contains(model.getName());
    }

    @Override
    public String getServiceName() {
        return serviceName;
    }
}
