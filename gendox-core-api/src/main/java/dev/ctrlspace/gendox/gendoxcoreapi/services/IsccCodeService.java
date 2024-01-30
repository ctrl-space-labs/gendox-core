package dev.ctrlspace.gendox.gendoxcoreapi.services;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Service
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
        return Base64.getEncoder().encodeToString(originalFileName.getBytes(StandardCharsets.UTF_8));
    }

    public IsccApiResponse getDocumentIsccCode(MultipartFile file, String originalDocumentName) throws IOException {

        return this.getDocumentIsccCode(file.getBytes(), originalDocumentName);
    }

    /**
     *
     * @param fileBytes
     * @param originalDocumentName
     * @return
     * @throws IOException
     */
    public IsccApiResponse getDocumentIsccCode(byte[] fileBytes, String originalDocumentName) throws IOException {
        String base64EncodedDocumentName = encodeFileName(originalDocumentName);


        ResponseEntity<IsccApiResponse> responseEntity = restTemplate.postForEntity(
                isccCodeApiendpoint,
                new HttpEntity<>(fileBytes, buildHeader(base64EncodedDocumentName)),
                IsccApiResponse.class);

        return responseEntity.getBody();
    }

}

