package dev.ctrlspace.gendox.gendoxcoreapi.model;

import org.junit.jupiter.api.Test;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import static org.assertj.core.api.Assertions.assertThat;

class ApiKeyTest {

    private final JsonMapper json = JsonMapper.builder().build();

    private static ApiKey apiKey() {
        ApiKey apiKey = new ApiKey();
        apiKey.setName("blog");
        apiKey.setApiKey("gxsk-0123456789abcdef");
        return apiKey;
    }

    @Test
    void aResponseShowsOnlyTheLastFourCharactersOfTheKey() {
        JsonNode response = json.valueToTree(apiKey());

        assertThat(response.get("apiKey").asString()).isEqualTo("****cdef");
        assertThat(response.toString()).doesNotContain("0123456789ab");
    }

    @Test
    void aRevealedKeyIsShownInFull() {
        JsonNode response = json.valueToTree(apiKey().revealed());

        assertThat(response.get("apiKey").asString()).isEqualTo("gxsk-0123456789abcdef");
    }

    @Test
    void theHashIsNeverInAResponse() {
        ApiKey apiKey = apiKey();

        assertThat(json.valueToTree(apiKey.revealed()).has("apiKeyHash")).isFalse();
        assertThat(json.valueToTree(apiKey).toString()).doesNotContain(apiKey.getApiKeyHash());
    }

    @Test
    void theHashIsSha256InLowerCaseHexAndSetWithTheKey() {
        // the published SHA-256 of "abc": the migration fills the column with the same function in SQL
        assertThat(ApiKey.hashOf("abc")).isEqualTo("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
        assertThat(apiKey().getApiKeyHash()).isEqualTo(ApiKey.hashOf("gxsk-0123456789abcdef"));
    }
}
