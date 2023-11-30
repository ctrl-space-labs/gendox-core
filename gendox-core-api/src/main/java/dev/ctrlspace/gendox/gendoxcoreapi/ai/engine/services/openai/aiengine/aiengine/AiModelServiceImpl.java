package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.openai.aiengine.aiengine;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request.*;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.*;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.utils.constants.*;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.AiModelRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ProjectService;
import org.apache.logging.log4j.util.Strings;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Profile({"prod", "integration", "openai-integration"})
@Service
public class AiModelServiceImpl implements AiModelService {

    @Value("${gendox.models.openai.ada2.key}")
    private String ada2key;

    Logger logger = LoggerFactory.getLogger(AiModelServiceImpl.class);

    @Autowired
    private ProjectService projectService;

    @Autowired
    private AiModelRepository aiModelRepository;


    private static final RestTemplate restTemplate = new RestTemplate();

    //    Build headers
    public HttpHeaders buildHeader() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(OpenAIADA2.MEDIA_TYPE));
        headers.add(OpenAIADA2.AUTHORIZATION, OpenAIADA2.BEARER + ada2key);
        return headers;
    }

    //    Generate response
    public Ada2Response getEmbeddingResponse(Ada2Request embeddingRequestHttpEntity) {
        logger.debug("Sending Embedding Request to OpenAI: {}", embeddingRequestHttpEntity);
        ResponseEntity<Ada2Response> responseEntity = restTemplate.postForEntity(
                OpenAIADA2.URL,
                new HttpEntity<>(embeddingRequestHttpEntity, buildHeader()),
                Ada2Response.class);
        logger.info("Received Embedding Response from OpenAI. Tokens billed: {}", responseEntity.getBody().getUsage().getTotalTokens());

        return responseEntity.getBody();
    }

    public GptResponse getCompletionResponse(GptRequest chatRequestHttpEntity) {
        logger.debug("Sending completion Request to OpenAI: {}", chatRequestHttpEntity);
        ResponseEntity<GptResponse> responseEntity = restTemplate.postForEntity(
                GPT35TurboConfig.URL,
                new HttpEntity<>(chatRequestHttpEntity, buildHeader()),
                GptResponse.class);
        logger.info("Received completion Response from OpenAI. Tokens billed: {}", responseEntity.getBody().getUsage().getTotalTokens());

        return responseEntity.getBody();
    }

    public Gpt35ModerationResponse getModerationResponse(Gpt35ModerationRequest moderationRequest) {
        logger.debug("Sending moderation Request to OpenAI: {}", moderationRequest);
        ResponseEntity<Gpt35ModerationResponse> responseEntity = restTemplate.postForEntity(
                GPT35Moderation.URL,
                new HttpEntity<>(moderationRequest, buildHeader()),
                Gpt35ModerationResponse.class);
        logger.info("Received moderation Response from OpenAI.");

        return responseEntity.getBody();
    }


    public Ada2Response askEmbedding(BotRequest botRequest) {
        return this.getEmbeddingResponse(Ada2Request.builder()
                .model(OpenAIADA2.MODEL)
                .input(botRequest.getMessage()).build());
    }

    public GptResponse askCompletionGpt(List<GptMessage> messages, String agentRole, String aiModelName, GptRequestParams gptRequestParams) {
        if (Strings.isNotEmpty(agentRole)) {
            messages.add(0, GptMessage.builder().role("system").content(agentRole).build());

        }
        return this.getCompletionResponse(GptRequest.builder()
                .model(aiModelName)
                .temperature(gptRequestParams.getTemperature())
                .topP(gptRequestParams.getTopP())
                .maxToken(gptRequestParams.getMaxToken())
                .messages(messages).build());
    }

    @Override
    public Gpt35ModerationResponse moderationCheck(String message) {
        return getModerationResponse(Gpt35ModerationRequest.builder()
                .input(message)
                .build());
    }


}






