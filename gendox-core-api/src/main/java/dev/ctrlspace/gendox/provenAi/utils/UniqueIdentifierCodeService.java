package dev.ctrlspace.gendox.provenAi.utils;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface UniqueIdentifierCodeService {


    UniqueIdentifierCodeResponse getDocumentUniqueIdentifier(MultipartFile file, String originalDocumentName) throws IOException;

    UniqueIdentifierCodeResponse getDocumentUniqueIdentifier(byte[] fileBytes, String originalDocumentName);



}
