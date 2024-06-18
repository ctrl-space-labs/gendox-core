package dev.ctrlspace.gendox.provenAi.utils;

import dev.ctrlspace.gendox.authentication.AuthenticationService;
import org.keycloak.representations.AccessTokenResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

@Service
public class ProvenAiAgentAuthenticationAdapter {


    private RestTemplate restTemplate;

    private AuthenticationService authenticationService;

    @Value("${proven-ai.base-url}")
    private String baseUrl;

    @Value("${proven-ai.context-path}")
    private String contextPath;

    @Value("${proven-ai.apis.agent-authentication.endpoint}")
    private String tokenApiPath;

    @Value("${proven-ai.apis.agent-authentication.grant-type}")
    private String grantType;

    @Value("${proven-ai.apis.agent-authentication.scope}")
    private String scope;



    @Autowired
    public ProvenAiAgentAuthenticationAdapter(RestTemplate restTemplate,
                                              AuthenticationService authenticationService) {
        this.restTemplate = restTemplate;
        this.authenticationService = authenticationService;
    }

    public AccessTokenResponse provenAiAgentAuthentication(String vpToken) {

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        // Build the request body with grant_type, scope, and vp_token
        MultiValueMap<String, String> requestBody = new LinkedMultiValueMap<>();
        requestBody.add("grant_type", grantType);
        requestBody.add("scope", scope);
        requestBody.add("vp_token", vpToken);

        HttpEntity<MultiValueMap<String, String>> requestEntity = new HttpEntity<>(requestBody, headers);

        // Build the URL with tokenApiUrl
        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(baseUrl + contextPath + tokenApiPath);

        // Send POST request to the token API URL
        ResponseEntity<AccessTokenResponse> responseEntity = restTemplate.exchange(
                builder.toUriString(),
                HttpMethod.POST,
                requestEntity,
                AccessTokenResponse.class);

        return responseEntity.getBody();
    }
}


