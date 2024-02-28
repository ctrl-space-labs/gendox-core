package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;

@Service
public class DownloadService {


    private ResourceLoader resourceLoader;



    @Autowired
    public DownloadService(ResourceLoader resourceLoader
                            ) {
        this.resourceLoader = resourceLoader;

    }

    public String readDocumentContent(String documentUrl) throws GendoxException, IOException {
        // get file
        InputStream inputStream = downloadFile(documentUrl);
        // files content
        String content = readTxtFileContent(inputStream);

        return content;
    }

    private String readTxtFileContent(InputStream inputStream) throws IOException {
        StringBuilder fileContent = new StringBuilder();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream))) {
            String line;
            while ((line = reader.readLine()) != null) {
                fileContent.append(line).append(" \n ");
            }
        }

        return fileContent.toString();
    }


    public InputStream downloadFile(String fileUrl) throws GendoxException {

        try {
            Resource fileResource = resourceLoader.getResource(fileUrl);
            InputStream inputStream = fileResource.getInputStream();
            return inputStream;
        } catch (Exception e) {
            // Handle any exceptions
            throw new GendoxException("ERROR_DOWNLOAD_FILE", "Error downloading file: " + fileUrl, HttpStatus.INTERNAL_SERVER_ERROR);
        }

    }
}
