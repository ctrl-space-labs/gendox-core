package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.openai.aiengine.aiengine;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request.BotRequest;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request.Ada2Request;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Ada2Response;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.utils.constants.OpenAIADA2;
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

@Profile({"prod", "integration", "openai-integration"})
@Service
public class AiModelServiceImpl implements AiModelService {

    @Value("${gendox.models.openai.ada2.key}")
    private String ada2key;

    Logger logger = LoggerFactory.getLogger(AiModelServiceImpl.class);

    private static final RestTemplate restTemplate = new RestTemplate();

    //    Build headers
    public HttpEntity<Ada2Request> buildHttpEntity(Ada2Request chatRequest) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(OpenAIADA2.MEDIA_TYPE));
        headers.add(OpenAIADA2.AUTHORIZATION, OpenAIADA2.BEARER + ada2key);
        return new HttpEntity<>(chatRequest, headers);
    }

    //    Generate response
    public Ada2Response getResponse(HttpEntity<Ada2Request> chatRequestHttpEntity) {
        logger.debug("Sending Embedding Request to OpenAI: {}", chatRequestHttpEntity);
        ResponseEntity<Ada2Response> responseEntity = restTemplate.postForEntity(
                OpenAIADA2.URL,
                chatRequestHttpEntity,
                Ada2Response.class);
        logger.info("Received Embedding Response from OpenAI. Tokens billed: {}", responseEntity.getBody().getUsage().getTotalTokens());

        return responseEntity.getBody();
    }

    public Ada2Response askEmbedding(BotRequest botRequest) {
        return this.getResponse(
                this.buildHttpEntity(
                        Ada2Request.builder()
                                .model(OpenAIADA2.MODEL)
                                .input(botRequest.getMessage()).build()));
    }
}






