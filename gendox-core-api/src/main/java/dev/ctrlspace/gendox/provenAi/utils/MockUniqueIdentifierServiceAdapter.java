package dev.ctrlspace.gendox.provenAi.utils;


import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@Service
public class MockUniqueIdentifierServiceAdapter implements UniqueIdentifierCodeService{


    @Override
    public UniqueIdentifierCodeResponse getDocumentUniqueIdentifier(MultipartFile file, String originalDocumentName) throws IOException {
        String uniqueIdentifier = generateRandomUUID();
        return UniqueIdentifierCodeResponse.builder()
                .uuid(uniqueIdentifier)
                .build();
    }

    @Override
    public UniqueIdentifierCodeResponse getDocumentUniqueIdentifier(byte[] fileBytes, String originalDocumentName) {
        String uniqueIdentifier = generateRandomUUID();
        return  UniqueIdentifierCodeResponse.builder()
                .uuid(uniqueIdentifier)
                .build();
    }

    private String generateRandomUUID() {
        return UUID.randomUUID().toString();
    }
}
