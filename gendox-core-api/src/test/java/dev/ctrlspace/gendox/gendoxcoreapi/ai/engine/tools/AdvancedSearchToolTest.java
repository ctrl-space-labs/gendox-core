package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools;

import com.fasterxml.jackson.databind.*;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.ToolExecutionContext;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.*;
import dev.ctrlspace.gendox.gendoxcoreapi.services.EmbeddingService;
import org.junit.jupiter.api.Test;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

class AdvancedSearchToolTest {
    @Test void keepsTextLimitAndRetainsUnusedSourcesWithoutTheirText() throws Exception {
        ObjectMapper mapper = new ObjectMapper(); EmbeddingService embeddings = mock(EmbeddingService.class);
        ProjectAgent agent = new ProjectAgent(); agent.setMaxSearchLimit(10L); agent.setMaxCompletionLimit(1L);
        Project project = new Project(); project.setProjectAgent(agent);
        DocumentInstanceDTO document = new DocumentInstanceDTO(); document.setId(UUID.randomUUID()); document.setTitle("Manual"); document.setExternalUrl("https://example.invalid/manual");
        var first = DocumentInstanceSectionDTO.builder().id(UUID.randomUUID()).documentInstanceDTO(document).sectionValue("selected text").tokenCount(5D).build();
        var second = DocumentInstanceSectionDTO.builder().id(UUID.randomUUID()).documentInstanceDTO(document).sectionValue("unused text").tokenCount(5D).build();
        when(embeddings.findClosestSectionsByQuery(anyString(), isNull(), eq(project), any())).thenReturn(List.of(first, second));
        var tool = new AdvancedSearchTool(embeddings, mapper);
        var context = new ToolExecutionContext(project, agent, new Message(), List.of(), new AiTools(), null);
        var result = tool.execute(mapper.getNodeFactory().textNode("{\"search_query\":\"question\"}"), context);
        assertEquals(1, result.path("sections").size());
        assertEquals("selected text", result.path("sections").get(0).path("section_text").asText());
        assertTrue(result.path("sections").get(0).path("is_completion_participant").asBoolean());
        assertEquals(1, result.path("search_history").size());
        assertFalse(result.path("search_history").get(0).has("section_text"));
        assertFalse(result.path("search_history").get(0).path("is_completion_participant").asBoolean(true));
        assertEquals(second.getId().toString(), result.path("search_history").get(0).path("provenance").path("sectionId").asText());
    }
}
