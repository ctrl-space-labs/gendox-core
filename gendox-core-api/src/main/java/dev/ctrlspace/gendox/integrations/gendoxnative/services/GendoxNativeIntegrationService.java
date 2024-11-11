package dev.ctrlspace.gendox.integrations.gendoxnative.services;

import dev.ctrlspace.gendox.integrations.gendoxnative.model.dto.AssignedContentIdsDTO;
import dev.ctrlspace.gendox.integrations.gendoxnative.model.dto.ContentDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class GendoxNativeIntegrationService {

    private final RestTemplate restTemplate;

    @Autowired
    public GendoxNativeIntegrationService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    // Method to build headers with the API key
    public HttpHeaders buildHeader(String apiKey) {
        HttpHeaders headers = new HttpHeaders();
        headers.add("X-WP-Gendox-API-Key", apiKey);
        return headers;
    }

    // Method to get Assigned Content IDs
    public AssignedContentIdsDTO getAssignedContentIds(String baseUrl, String projectId, String apiKey) {
//        String url = "https://test.dma.com.gr/wp-json/gendox/v1/assigned-ids?project_id=" + projectId;
        String url = baseUrl + "/gendox/v1/assigned-ids?project_id=" + projectId;
        HttpEntity<String> entity = new HttpEntity<>(buildHeader(apiKey));

        ResponseEntity<AssignedContentIdsDTO> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                entity,
                AssignedContentIdsDTO.class
        );

        return response.getBody();
    }

    // Method to get Content by ID
    public ContentDTO getContentById(String baseUrl, Long contentId, String apiKey) {
        String url = baseUrl + "/gendox/v1/content?content_id=" + contentId;
        HttpEntity<String> entity = new HttpEntity<>(buildHeader(apiKey));

        ResponseEntity<ContentDTO> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                entity,
                ContentDTO.class
        );

        return response.getBody();
    }
}


