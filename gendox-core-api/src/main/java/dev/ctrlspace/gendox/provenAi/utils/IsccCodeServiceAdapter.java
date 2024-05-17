package dev.ctrlspace.gendox.provenAi.utils;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Service
public class IsccCodeServiceAdapter implements UniqueIdentifierCodeService{

    private static final RestTemplate restTemplate = new RestTemplate();
    String isccCodeApiendpoint = "https://iscc.io/api/v1/iscc";

    public HttpHeaders  buildHeader(String base64EncodedFileName) {
        HttpHeaders headers = new HttpHeaders();
        //header for X-Upload-Filename
        headers.add("X-Upload-Filename", base64EncodedFileName);
        return headers;
    }

    private String encodeFileName(String originalFileName) {
        return Base64.getEncoder().encodeToString(originalFileName.getBytes(StandardCharsets.UTF_8));
    }

    public UniqueIdentifierCodeResponse getDocumentUniqueIdentifier(MultipartFile file, String originalDocumentName) throws IOException {
        return this.getDocumentUniqueIdentifier(file.getBytes(), originalDocumentName);
    }

    /**
     *
     * @param fileBytes
     * @param originalDocumentName
     * @return
     */
    public UniqueIdentifierCodeResponse getDocumentUniqueIdentifier(byte[] fileBytes, String originalDocumentName) {
        String base64EncodedDocumentName = encodeFileName(originalDocumentName);

        ResponseEntity<IsccCodeResponse> responseEntity = restTemplate.postForEntity(
                isccCodeApiendpoint,
                new HttpEntity<>(fileBytes, buildHeader(base64EncodedDocumentName)),
                IsccCodeResponse.class);

        IsccCodeResponse isccCodeResponse = responseEntity.getBody();

        // Convert IsccCodeResponse to UniqueIdentifierCodeResponse
        UniqueIdentifierCodeResponse uniqueIdentifierCodeResponse = toUniqueIdentifierCodeResponse(isccCodeResponse);

        return uniqueIdentifierCodeResponse;
    }

    public UniqueIdentifierCodeResponse toUniqueIdentifierCodeResponse(IsccCodeResponse isccCodeResponse) {
        return UniqueIdentifierCodeResponse.builder()
                .context(isccCodeResponse.getContext())
                .type(isccCodeResponse.getType())
                .schema(isccCodeResponse.getSchema())
                .iscc(isccCodeResponse.getIscc())
                .name(isccCodeResponse.getName())
                .mediaId(isccCodeResponse.getMediaId())
                .content(isccCodeResponse.getContent())
                .mode(isccCodeResponse.getMode())
                .filename(isccCodeResponse.getFilename())
                .filesize(isccCodeResponse.getFilesize())
                .mediatype(isccCodeResponse.getMediatype())
                .characters(isccCodeResponse.getCharacters())
                .metahash(isccCodeResponse.getMetahash())
                .datahash(isccCodeResponse.getDatahash())
                .build();
    }
}

