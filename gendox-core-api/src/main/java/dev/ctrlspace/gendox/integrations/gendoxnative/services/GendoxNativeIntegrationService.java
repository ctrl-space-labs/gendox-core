package dev.ctrlspace.gendox.integrations.gendoxnative.services;

import dev.ctrlspace.gendox.gendoxcoreapi.services.integrations.ApiIntegrationUpdateService;
import dev.ctrlspace.gendox.integrations.gendoxnative.model.dto.OrganizationAssignedContentDTO;
import dev.ctrlspace.gendox.integrations.gendoxnative.model.dto.AssignedContentIdsDTO;
import dev.ctrlspace.gendox.integrations.gendoxnative.model.dto.ContentDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Service
public class GendoxNativeIntegrationService {

    Logger logger = LoggerFactory.getLogger(GendoxNativeIntegrationService.class);


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


    public OrganizationAssignedContentDTO getProjectAssignedContentsByOrganizationId(String baseUrl, String organizationId, String apiKey) {
        String url = baseUrl + "/gendox/v1/assigned-projects?organization_id=" + organizationId;
        HttpEntity<String> entity = new HttpEntity<>(buildHeader(apiKey));

        try {
            logger.info("Fetching assigned projects with URL: {}", url);

            // Log raw response
            ResponseEntity<String> rawResponse = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    String.class
            );
            logger.debug("Raw API response: {}", rawResponse.getBody());


            ResponseEntity<List<AssignedContentIdsDTO>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    new ParameterizedTypeReference<List<AssignedContentIdsDTO>>() {}
            );


            logger.info("Deserialized Response: {}", response.getBody());
//            return response.getBody();
            return OrganizationAssignedContentDTO.builder()
                    .projects(response.getBody())
                    .build();

        } catch (Exception e) {
            logger.error("Error fetching project assigned contents: {}", e.getMessage());
            throw new RuntimeException("Failed to fetch project assigned contents", e);
        }
    }

    // Method to get Assigned Content IDs
    public AssignedContentIdsDTO getAssignedContentIds(String baseUrl, String projectId, String apiKey) {
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


