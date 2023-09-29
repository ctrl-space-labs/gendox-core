package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.openai.aiengine.aiengine;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request.*;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Ada2Response;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Gpt35Response;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.utils.constants.GPT35TurboConfig;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.utils.constants.OpenAIADA2;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AuditLogs;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
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

    public Gpt35Response getCompletionResponse(Gpt35Request chatRequestHttpEntity) {
        logger.debug("Sending completion Request to OpenAI: {}", chatRequestHttpEntity);
        ResponseEntity<Gpt35Response> responseEntity = restTemplate.postForEntity(
                GPT35TurboConfig.URL,
                new HttpEntity<>(chatRequestHttpEntity, buildHeader()),
                Gpt35Response.class);
        logger.info("Received completion Response from OpenAI. Tokens billed: {}", responseEntity.getBody().getUsage().getTotalTokens());

        return responseEntity.getBody();
    }

    public Ada2Response askEmbedding(BotRequest botRequest) {
        return this.getEmbeddingResponse(Ada2Request.builder()
                        .model(OpenAIADA2.MODEL)
                        .input(botRequest.getMessage()).build());
    }

    public Gpt35Response askCompletion(List<Gpt35Message> messages, String agentRole){

        if (Strings.isNotEmpty(agentRole)){
            messages.add(0, Gpt35Message.builder().role("system").content(agentRole).build());

        }

        return this.getCompletionResponse(Gpt35Request.builder()
                        .model(GPT35TurboConfig.MODEL)
                        .messages(messages).build());
    }
}






