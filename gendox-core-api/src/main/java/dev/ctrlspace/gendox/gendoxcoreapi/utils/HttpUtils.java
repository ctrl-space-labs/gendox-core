package dev.ctrlspace.gendox.gendoxcoreapi.utils;

import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class HttpUtils {

    public Map<String, String> getBearerTokenHeader(String token) {
        return Map.of("Authorization", "Bearer " + token);
    }
}
