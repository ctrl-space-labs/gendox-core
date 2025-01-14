package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos;

import dev.ctrlspace.gendox.gendoxcoreapi.model.ApiKey;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class WebsiteIntegrationDTO {
    private String domain;
    private String contextPath;
    private ApiKeyDTO apiKey;
    private IntegrationTypeDTO integrationType;
    private IntegrationStatusDTO integrationStatus;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ApiKeyDTO {
        private String apiKey;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class IntegrationTypeDTO {
        private String name;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class IntegrationStatusDTO {
        private String name;
    }

}
