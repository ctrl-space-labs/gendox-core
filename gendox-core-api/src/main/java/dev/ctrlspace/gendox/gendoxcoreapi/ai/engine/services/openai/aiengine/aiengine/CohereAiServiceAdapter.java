package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.openai.aiengine.aiengine;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request.*;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.*;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.utils.constants.CohereConfig;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.CompletionResponseConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.EmbeddingResponseConverter;
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

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
public class CohereAiServiceAdapter implements AiModelService{

    Logger logger = LoggerFactory.getLogger(CohereAiServiceAdapter.class);

    private Set<String> supportedModels = Set.of("command", "embed-multilingual-v3.0");

    private AiModelRepository aiModelRepository;

    private  CompletionResponseConverter completionResponseConverter;

    private EmbeddingResponseConverter embeddingResponseConverter;
    @Value("${gendox.models.cohere.key}")
    private String coherekey;


    @Autowired
    public CohereAiServiceAdapter(AiModelRepository aiModelRepository,
                                CompletionResponseConverter completionResponseConverter,
                                EmbeddingResponseConverter embeddingResponseConverter){
        this.aiModelRepository = aiModelRepository;
        this.embeddingResponseConverter = embeddingResponseConverter;
        this.completionResponseConverter = completionResponseConverter;
    }

    private static final RestTemplate restTemplate = new RestTemplate();

    private HttpHeaders buildHeader() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(CohereConfig.MEDIA_TYPE));
        headers.add(CohereConfig.AUTHORIZATION, CohereConfig.BEARER + coherekey);

        return headers;
    }


    public CohereEmbedMultilingualResponse getEmbeddingResponse(CohereEmbedMultilingualRequest embeddingRequestHttpEntity) {
        logger.debug("Sending Embedding Request to Cohere: {}", embeddingRequestHttpEntity);
        ResponseEntity<CohereEmbedMultilingualResponse> responseEntity = restTemplate.postForEntity(
                CohereConfig.EMBEDDINGS_URL,
                new HttpEntity<>(embeddingRequestHttpEntity, buildHeader()),
                CohereEmbedMultilingualResponse.class);
        logger.info("Received Embedding Response from OpenAI. Tokens billed: {}",
                responseEntity.getBody().getMeta().getBilledUnits().getInputTokens() + responseEntity.getBody().getMeta().getBilledUnits().getOutputTokens());

        return responseEntity.getBody();
    }


    public CohereCommandResponse getCompletionResponse(CohereCommandRequest chatRequestHttpEntity) {
        logger.debug("Sending completion Request to OpenAI: {}", chatRequestHttpEntity);
        ResponseEntity<CohereCommandResponse> responseEntity = restTemplate.postForEntity(
                CohereConfig.COMPLETION_URL,
                new HttpEntity<>(chatRequestHttpEntity, buildHeader()),
                CohereCommandResponse.class);
        logger.info("Received completion Response from Cohere. Tokens billed: {}",
                responseEntity.getBody().getCohereBilledUnits().getInputTokens(), responseEntity.getBody().getCohereBilledUnits().getOutputTokens());

        return responseEntity.getBody();
    }



    public EmbeddingResponse askEmbedding(BotRequest botRequest, String aiModelName) {
        CohereEmbedMultilingualResponse cohereEmbedMultilingualResponse = this.getEmbeddingResponse(CohereEmbedMultilingualRequest.builder()
                .model(aiModelName)
                .texts(botRequest.getMessages())
                .input_type("search_query")
                .build());

        EmbeddingResponse embeddingResponse = embeddingResponseConverter.coheretoEmbeddingResponse(cohereEmbedMultilingualResponse, aiModelName);

        return embeddingResponse;

    }


    @Override
    public CompletionResponse askCompletion(List<AiModelMessage> messages, String agentRole, String aiModelName, AiModelRequestParams aiModelRequestParams) {
        List<String> messageContents = extractMessageContents(messages);
        String inputString = Strings.isNotEmpty(agentRole) ? "system " + agentRole + " " + String.join(" ", messageContents) : String.join(" ", messageContents);



            if (Strings.isNotEmpty(agentRole)) {
            messages.add(0, AiModelMessage.builder().role("system").content(agentRole).build());

        }

            CohereCommandResponse cohereCommandResponse = this.getCompletionResponse(CohereCommandRequest.builder()
                .model(aiModelName)
                .temperature(aiModelRequestParams.getTemperature())
                .topP(aiModelRequestParams.getTopP())
                .k(aiModelRequestParams.getK())
                .maxTokens(aiModelRequestParams.getMaxTokens())
                .prompt(inputString).build());

        CompletionResponse completionResponse = completionResponseConverter.coheretoCompletionResponse(cohereCommandResponse);

        return completionResponse;
    }

    private List<String> extractMessageContents(List<AiModelMessage> messages) {
        List<String> messageContents = new ArrayList<>();
        for (AiModelMessage message : messages) {
            messageContents.add(message.getContent());
        }
        return messageContents;
    }
    @Override
    public OpenAiGpt35ModerationResponse moderationCheck(String message) {
        return null;
    }


    @Override
    public boolean supports(String model) {
        return supportedModels.contains(model);
    }
}
