package dev.ctrlspace.gendox.authentication;


import com.amazonaws.util.StringInputStream;
import com.google.auth.oauth2.AccessToken;
import com.google.auth.oauth2.GoogleCredentials;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Collections;

/**
 * Service for handling Google Cloud authentication.
 * This is mainly to login to GCP service accounts, mainly for VertexAI finetuned models.
 */
@Service
public class GCloudAuthenticationService {


    private static final String CLOUD_SCOPE = "https://www.googleapis.com/auth/cloud-platform";


    private String clientSecret;

    GoogleCredentials credentials;


    public GCloudAuthenticationService(@Value("${cloud.gcloud.client-secret}") String clientSecret) throws IOException {
        this.clientSecret = clientSecret;

        //initialize google credentials
        if (clientSecret != null && !clientSecret.isBlank()) {
            try (InputStream is = new StringInputStream(clientSecret)) {
                credentials = GoogleCredentials.fromStream(is).createScoped(Collections.singleton(CLOUD_SCOPE));
            }
        }
    }

    public String getClientToken() throws GendoxException {
        try {
            credentials.refreshIfExpired();

            AccessToken token = credentials.getAccessToken();
            if (token == null) {
                credentials.refresh();
                token = credentials.getAccessToken();
            }
            return token.getTokenValue();
        } catch (IOException e) {
            throw new GendoxException("GCLOUD_AUTHENTICATION_ERROR", "Error obtaining GCloud access token: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR, e);
        }
    }

}
