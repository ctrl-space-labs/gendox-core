package dev.ctrlspace.gendox.gendoxcoreapi.converters;


import dev.ctrlspace.gendox.gendoxcoreapi.model.ApiKey;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ApiKeyDTO;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;

@Component
public class ApiKeyConverter implements GendoxConverter<ApiKey, ApiKeyDTO> {


    @Override
    public ApiKeyDTO toDTO(ApiKey apiKey) {
        ApiKeyDTO apiKeyDTO = new ApiKeyDTO();

        apiKeyDTO.setOrganizationId(apiKey.getOrganizationId());
        apiKeyDTO.setName(apiKey.getName());
        apiKeyDTO.setIsActive(apiKey.getActive());


        return apiKeyDTO;
    }

    @Override
    public ApiKey toEntity(ApiKeyDTO apiKeyDTO) {
        ApiKey apiKey = new ApiKey();

        apiKey.setOrganizationId(apiKeyDTO.getOrganizationId());
        apiKey.setName(apiKeyDTO.getName());
        apiKey.setActive(apiKeyDTO.getIsActive());
        Instant now = Instant.now();
        apiKey.setStartDate(now);
        Instant endDate = now.plus(Duration.ofDays(apiKeyDTO.getDurationInDays()));
        apiKey.setEndDate(endDate);

        return apiKey;
    }
}
