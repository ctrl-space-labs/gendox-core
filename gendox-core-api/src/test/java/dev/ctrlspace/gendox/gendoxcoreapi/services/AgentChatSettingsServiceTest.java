package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxRuntimeException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ChatSettings;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectAgent;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AgentChatSettingsServiceTest {

    final SecurityUtils securityUtils = mock(SecurityUtils.class);
    final AgentChatSettingsService service = new AgentChatSettingsService(securityUtils);

    private static ChatSettings settings(List<String> questions, String theme, String accent) {
        return new ChatSettings("Hi! Ask me about returns.", questions, theme, accent, "#FFFFFF", "Ask us", "AI can be wrong.");
    }

    private static ProjectAgent agent(ChatSettings settings, String branding) {
        ProjectAgent agent = new ProjectAgent();
        agent.setChatSettings(settings);
        agent.setBranding(branding);
        return agent;
    }

    @Test
    void settingsAreSavedWithBlankQuestionsDropped() {
        ProjectAgent existing = agent(null, "STANDARD");

        service.apply(agent(settings(Arrays.asList("Where is my order? ", " ", null), "DARK", "#127a5b"), null), existing);

        assertEquals(List.of("Where is my order?"), existing.getChatSettings().suggestedQuestions());
        assertEquals("DARK", existing.getChatSettings().theme());
        assertEquals("STANDARD", existing.getBranding());
    }

    @Test
    void anAgentSentWithoutSettingsKeepsItsOwn() {
        ChatSettings saved = settings(List.of("What does the warranty cover?"), "LIGHT", "#127a5b");
        ProjectAgent existing = agent(saved, "SMALL");

        service.apply(agent(null, null), existing);

        assertSame(saved, existing.getChatSettings());
        assertEquals("SMALL", existing.getBranding());
    }

    @Test
    void onlyGendoxRemovesTheBranding() {
        ProjectAgent existing = agent(null, "STANDARD");

        GendoxRuntimeException e = assertThrows(GendoxRuntimeException.class, () -> service.apply(agent(null, "NONE"), existing));
        assertEquals(HttpStatus.FORBIDDEN, e.getStatus());

        when(securityUtils.isSuperAdmin()).thenReturn(true);
        service.apply(agent(null, "NONE"), existing);
        assertEquals("NONE", existing.getBranding());
    }

    @Test
    void anOwnerSavingAnAgentGendoxUnbrandedKeepsIt() {
        ProjectAgent existing = agent(null, "NONE");

        service.apply(agent(settings(List.of(), "AUTO", null), "NONE"), existing);

        assertEquals("NONE", existing.getBranding());
    }

    @Test
    void colorsThemesAndLengthsAreChecked() {
        ProjectAgent existing = agent(null, "STANDARD");

        assertThrows(GendoxRuntimeException.class, () -> service.apply(agent(settings(List.of(), "BLUE", null), null), existing));
        assertThrows(GendoxRuntimeException.class, () -> service.apply(agent(settings(List.of(), null, "red;}body{"), null), existing));
        assertThrows(GendoxRuntimeException.class, () -> service.apply(agent(settings(List.of("a", "b", "c", "d", "e", "f", "g"), null, null), null), existing));
        assertThrows(GendoxRuntimeException.class, () -> service.apply(agent(settings(List.of("x".repeat(201)), null, null), null), existing));
    }

    @Test
    void aNewAgentGetsTheStandardBranding() {
        ProjectAgent created = agent(null, null);

        service.applyOnCreate(created);

        assertEquals("STANDARD", created.getBranding());
    }
}
