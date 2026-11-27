package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.artifacts;

import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

import static org.junit.jupiter.api.Assertions.*;

class ArtifactDataRequestDTOTest {

    private final ObjectMapper objectMapper = JsonMapper.builder().build();

    @Test
    void aWriteWithoutPrivateIsAShared() {
        ArtifactDataRequestDTO request = objectMapper.readValue("{\"data\":{\"choice\":\"A\"}}", ArtifactDataRequestDTO.class);

        assertFalse(request.wantsPrivate());
        assertNull(request.getRevision());
        assertEquals("A", request.getData().get("choice").asText());
    }

    @Test
    void privateAndRevisionAreRead() {
        ArtifactDataRequestDTO request = objectMapper.readValue("{\"data\":{},\"private\":true,\"revision\":0}",
                ArtifactDataRequestDTO.class);

        assertTrue(request.wantsPrivate());
        assertEquals(0, request.getRevision());
    }
}
