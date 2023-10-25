package dev.ctrlspace.gendox.gendoxcoreapi.discord.post;

import dev.ctrlspace.gendox.gendoxcoreapi.discord.post.records.CompletionMessagePost;
import dev.ctrlspace.gendox.gendoxcoreapi.discord.post.records.SearchMessagePost;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstanceSection;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.CompletionMessageDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.net.http.HttpHeaders;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;


@Service
public class PostService {


    @Value("${gendox.domain.base-url}")
    private String baseUrl;
    @Value("${server.servlet.context-path}")
    private String contextPath;
    @Value("${gendox.domain.messages.completion.post-completion-message}")
    private String completionMessage;
    @Value("${gendox.domain.messages.search.post-search-message}")
    private String searchMessage;
    @Value("${gendox.pages.default}")
    private String defaultPage;

    @Autowired
    private MessageRestClient messageRestClientService;


    private final RestClient restClient;


    public PostService() {
        restClient = RestClient.builder()
                .baseUrl("http://" + baseUrl + contextPath)
                .build();

    }


    public CompletionMessageDTO completionMessageDTO(String token, Message message, UUID projectId) {
        String url = new StringBuilder()
                .append("http://")
                .append(baseUrl)
                .append(contextPath)
                .append(completionMessage)
                .append("?projectId=")
                .append(projectId.toString())
                .append(defaultPage)
                .toString();

        return restClient.post()
                .uri(url)
                .header("Authorization", "Bearer " + token)
                .body(message)
                .retrieve()
                .body(new ParameterizedTypeReference<CompletionMessageDTO>() {
                });
    }


//    public CompletionMessageDTO completionMessageDTO(String token, Message message, UUID projectId) {
//
//
//        Map<String, String> headers = new LinkedHashMap<>();
//        headers.put("Authorization", "Bearer " + token);
//        return messageRestClient.completionMessageDTO(headers, message, projectId);
//
//    }

    public List<LinkedHashMap> searchMessagePosts(String token, Message message, UUID projectId) {

        String url = new StringBuilder()
                .append("http://")
                .append(baseUrl)
                .append(contextPath)
                .append(searchMessage)
                .append("?projectId=")
                .append(projectId.toString())
                .append(defaultPage)
                .toString();

        return restClient.post()
                .uri(url)
                .header("Authorization", "Bearer " + token)
                .body(message)
                .retrieve()
                .body(new ParameterizedTypeReference<List<LinkedHashMap>>() {
                });
    }



}
