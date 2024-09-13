package dev.ctrlspace.gendox.provenAi.utils;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.SearchResult;
import dev.ctrlspace.gendox.authentication.AuthenticationService;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;

@Service
public class ProvenAiQueryAdapter {

    private RestTemplate restTemplate;

    private String searchApiUrl;

    private AuthenticationService authenticationService;

    @Value("${proven-ai.base-url}")
    private String baseUrl;

    @Value("${proven-ai.context-path}")
    private String contextPath;

    @Value("${proven-ai.apis.search.endpoint}")
    private String searchApiPath;

    @Autowired
    public ProvenAiQueryAdapter(RestTemplate restTemplate,
                                AuthenticationService authenticationService
                                ) {
        this.restTemplate = restTemplate;
        this.authenticationService = authenticationService;
    }

    public List<SearchResult> provenAiSearch(String question, String agentJwtToken) {



        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.add("Authorization", "Bearer " + agentJwtToken);

        HttpEntity<String> requestEntity = new HttpEntity<>(question, headers);

        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(baseUrl + contextPath + searchApiPath);

        ResponseEntity<List<SearchResult>> responseEntity = restTemplate.exchange(
                builder.toUriString(),
                HttpMethod.POST,
                requestEntity,
                new ParameterizedTypeReference<List<SearchResult>>() {});

        return responseEntity.getBody();
    }
    }

