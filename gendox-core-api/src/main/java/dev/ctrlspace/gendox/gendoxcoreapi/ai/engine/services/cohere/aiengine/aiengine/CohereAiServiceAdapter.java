package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.cohere.aiengine.aiengine;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.converters.CohereRerankResponseConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.cohere.request.CohereCompletionRequest;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.cohere.request.CohereEmbedRequest;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.cohere.request.CohereRerankRequest;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.cohere.response.CohereCompletionResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.cohere.response.CohereEmbedResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.cohere.response.CohereRerankResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.*;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.AiModelApiAdapterService;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.utils.constants.CohereConfig;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.converters.CohereCompletionResponseConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.converters.CohereEmbeddingResponseConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModel;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiTools;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.AiModelRepository;
import org.apache.logging.log4j.util.Strings;
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
    private RestTemplate restTemplate;
    private CohereCompletionResponseConverter cohereCompletionResponseConverter;
    private CohereEmbeddingResponseConverter cohereEmbeddingResponseConverter;
    private CohereRerankResponseConverter cohereRerankResponseConverter;


    @Autowired
    public CohereAiServiceAdapter(CohereCompletionResponseConverter cohereCompletionResponseConverter,
                                  CohereEmbeddingResponseConverter cohereEmbeddingResponseConverter,
                                    CohereRerankResponseConverter cohereRerankResponseConverter,
                                  RestTemplate restTemplate) {
        this.cohereEmbeddingResponseConverter = cohereEmbeddingResponseConverter;
        this.cohereCompletionResponseConverter = cohereCompletionResponseConverter;
        this.cohereRerankResponseConverter = cohereRerankResponseConverter;
        this.restTemplate = restTemplate;
    }

    private HttpHeaders buildHeader(String apiKey) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(CohereConfig.MEDIA_TYPE));
        headers.add(CohereConfig.AUTHORIZATION, CohereConfig.BEARER + apiKey);
        return headers;
    }



    public CohereEmbedResponse getEmbeddingResponse(CohereEmbedRequest embeddingRequestHttpEntity, AiModel aiModel, String apiKey) {
        String embeddingsApiUrl = aiModel.getUrl();
        logger.debug("Sending Embedding Request to '{}': {}", embeddingsApiUrl, embeddingRequestHttpEntity);
        logger.info("AiModel for embeddings-->: {}", aiModel.getModel());
        ResponseEntity<CohereEmbedResponse> responseEntity = restTemplate.postForEntity(
                embeddingsApiUrl,
                new HttpEntity<>(embeddingRequestHttpEntity, buildHeader(apiKey)),
                CohereEmbedResponse.class);
        logger.info("Received Embedding Response from '{}'. Tokens billed: {}", embeddingsApiUrl,
                responseEntity.getBody().getMeta().getBilled_units().getInput_tokens());

        return responseEntity.getBody();
    }


    public CohereCompletionResponse getCompletionResponse(CohereCompletionRequest chatRequestHttpEntity, AiModel aiModel, String apiKey) {
        String completionApiUrl = aiModel.getUrl();
        logger.debug("Sending completion Request to '{}': {}", completionApiUrl, chatRequestHttpEntity);
        logger.info("AiModel for completion: {}", aiModel.getModel());
        ResponseEntity<CohereCompletionResponse> responseEntity = restTemplate.postForEntity(
                completionApiUrl,
                new HttpEntity<>(chatRequestHttpEntity, buildHeader(apiKey)),
                CohereCompletionResponse.class);
        logger.info("Received completion Response from '{}'. Tokens billed: {}", completionApiUrl,
                responseEntity.getBody().getUsage().getBilled_units().getInput_tokens() + responseEntity.getBody().getUsage().getBilled_units().getOutput_tokens());

        return responseEntity.getBody();
    }

    public CohereRerankResponse getRerankResponse(CohereRerankRequest rerankRequestHttpEntity, AiModel aiModel, String apiKey) {
        String rerankApiUrl = aiModel.getUrl();
        logger.debug("Sending Rerank Request to '{}': {}", rerankApiUrl, rerankRequestHttpEntity);
        logger.info("AiModel for rerank: {}", aiModel.getModel());
        ResponseEntity<CohereRerankResponse> responseEntity = restTemplate.postForEntity(
                rerankApiUrl,
                new HttpEntity<>(rerankRequestHttpEntity, buildHeader(apiKey)),
                CohereRerankResponse.class);
        logger.info("Received Rerank Response from '{}'. Tokens billed: {}", rerankApiUrl,
                responseEntity.getBody().getMeta().getBilled_units().getSearch_units());

        return responseEntity.getBody();
    }

    @Override
    public EmbeddingResponse askEmbedding(EmbeddingMessage embeddingMessage, AiModel aiModel, String apiKey) {
        CohereEmbedResponse cohereEmbedResponse = this.getEmbeddingResponse((CohereEmbedRequest.builder()
                        .model(aiModel.getModel())
                        .texts(embeddingMessage.getMessages())
                        .inputType("search-document")
                        .embeddingTypes(List.of("float"))
                        .build()),
                aiModel,
                apiKey);

        return cohereEmbeddingResponseConverter.coheretoEmbeddingResponse(cohereEmbedResponse, aiModel);

    }

    @Override
    public CompletionResponse askCompletion(List<AiModelMessage> messages, String agentRole, AiModel aiModel, AiModelRequestParams aiModelRequestParams, String apiKey, List<AiTools> tools, String toolChoice) {

        if (Strings.isNotEmpty(agentRole)) {
            messages.add(0, AiModelMessage.builder().role("user").content(agentRole).build());
        }


        CohereCompletionRequest.CohereCompletionRequestBuilder cohereCommandRequestBuilder = CohereCompletionRequest.builder()
                .model(aiModel.getModel())
                .messages(
                        messages.stream()
                                .map(message -> CohereCompletionRequest.Message.builder()
                                        .role(message.getRole())
                                        .content(List.of(CohereCompletionRequest.Message.Content.builder()
                                                .type("text")
                                                .text(message.getContent())
                                                .build()))
                                        .build())
                                .toList()
                );



        CohereCompletionRequest cohereCompletionRequest = cohereCommandRequestBuilder.build();
        CohereCompletionResponse cohereCompletionResponse = this.getCompletionResponse(cohereCompletionRequest, aiModel, apiKey);

        return cohereCompletionResponseConverter.toCompletionResponse(cohereCompletionResponse);
    }

    @Override
    public ModerationResponse askModeration(String message, String apiKey, AiModel aiModel) {
        return null;
    }

    @Override
    public RerankResponse askRerank(List<String> documents, String query, AiModel aiModel, String apiKey) {
        CohereRerankResponse cohereRerankResponse = this.getRerankResponse(
                CohereRerankRequest.builder()
                        .model(aiModel.getModel())
                        .query(query)
                        .documents(documents)
                        .build(),
                aiModel,
                apiKey);
        return cohereRerankResponseConverter.toRerankResponse(cohereRerankResponse);
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
