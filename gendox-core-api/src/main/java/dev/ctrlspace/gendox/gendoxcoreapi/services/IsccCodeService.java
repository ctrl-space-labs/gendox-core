package dev.ctrlspace.gendox.gendoxcoreapi.services;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;

import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

public class IsccCodeService {

    private static final RestTemplate restTemplate = new RestTemplate();
    String isccCodeApiendpoint = "https://iscc.io/api/v1/iscc";


    public HttpHeaders buildHeader(String base64EncodedFileName) {
        HttpHeaders headers = new HttpHeaders();

        //header for X-Upload-Filename
        headers.add("X-Upload-Filename", base64EncodedFileName);
        return headers;

    }
    private String encodeFileName(String originalFileName) {
        // Encode the original file name to base64
        return Base64.getEncoder().encodeToString(originalFileName.getBytes(StandardCharsets.UTF_8));
    }


    public IsccApiResponse getDocumentIsccCode(byte[] fileData, String originalDocumentName) {
        String base64EncodedDocumentName = encodeFileName(originalDocumentName);

        ResponseEntity<IsccApiResponse> responseEntity = restTemplate.postForEntity(
                isccCodeApiendpoint,
                new HttpEntity<>(fileData, buildHeader(base64EncodedDocumentName)),
                IsccApiResponse.class);

        return responseEntity.getBody();
    }

}
