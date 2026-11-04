package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxRuntimeException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ChatSettings;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectAgent;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * The Deploy settings of an agent's chat (#527): how it looks, and its branding. The look is the owner's
 * choice; removing the "Powered by Gendox" line is a plan entitlement, so only Gendox (a super admin) sets NONE.
 */
@Service
public class AgentChatSettingsService {

    public static final String BRANDING_STANDARD = "STANDARD";
    public static final String BRANDING_NONE = "NONE";
    private static final Set<String> BRANDINGS = Set.of(BRANDING_STANDARD, "SMALL", BRANDING_NONE);
    private static final Set<String> THEMES = Set.of("LIGHT", "DARK", "AUTO");
    // Colours reach the widget's CSS, so only plain hex is accepted
    private static final Pattern HEX_COLOR = Pattern.compile("^#[0-9a-fA-F]{6}$");
    private static final int MAX_SUGGESTED_QUESTIONS = 6;
    private static final int MAX_QUESTION_LENGTH = 200;
    private static final int MAX_MESSAGE_LENGTH = 500;
    private static final int MAX_BUBBLE_TEXT_LENGTH = 40;

    private final SecurityUtils securityUtils;

    public AgentChatSettingsService(@Lazy SecurityUtils securityUtils) {
        this.securityUtils = securityUtils;
    }

    /** Copies the chat settings and branding sent in {@code incoming} to {@code existing}; a field left out is kept. */
    public void apply(ProjectAgent incoming, ProjectAgent existing) {
        if (incoming.getChatSettings() != null) {
            existing.setChatSettings(validated(incoming.getChatSettings()));
        }
        if (incoming.getBranding() != null && !incoming.getBranding().equals(existing.getBranding())) {
            existing.setBranding(validatedBranding(incoming.getBranding()));
        }
    }

    /** Validates the settings a new agent is created with; without a branding it gets the standard line. */
    public void applyOnCreate(ProjectAgent agent) {
        if (agent.getChatSettings() != null) {
            agent.setChatSettings(validated(agent.getChatSettings()));
        }
        agent.setBranding(agent.getBranding() == null ? BRANDING_STANDARD : validatedBranding(agent.getBranding()));
    }

    ChatSettings validated(ChatSettings settings) {
        List<String> questions = settings.suggestedQuestions() == null ? List.of() : settings.suggestedQuestions().stream()
                .filter(question -> question != null && !question.isBlank())
                .map(String::strip)
                .toList();
        if (questions.size() > MAX_SUGGESTED_QUESTIONS) {
            throw invalid("TOO_MANY_SUGGESTED_QUESTIONS", "An agent can suggest at most " + MAX_SUGGESTED_QUESTIONS + " questions");
        }
        questions.forEach(question -> requireLength(question, MAX_QUESTION_LENGTH, "A suggested question"));
        requireLength(settings.welcomeMessage(), MAX_MESSAGE_LENGTH, "The welcome message");
        requireLength(settings.disclaimer(), MAX_MESSAGE_LENGTH, "The disclaimer");
        requireLength(settings.bubbleText(), MAX_BUBBLE_TEXT_LENGTH, "The bubble text");
        if (settings.theme() != null && !THEMES.contains(settings.theme())) {
            throw invalid("INVALID_CHAT_THEME", "The theme must be LIGHT, DARK or AUTO");
        }
        requireColor(settings.accentColor(), "accent");
        requireColor(settings.backgroundColor(), "background");
        return new ChatSettings(settings.welcomeMessage(), questions, settings.theme(), settings.accentColor(),
                settings.backgroundColor(), settings.bubbleText(), settings.disclaimer());
    }

    private String validatedBranding(String branding) {
        if (!BRANDINGS.contains(branding)) {
            throw invalid("INVALID_BRANDING", "Branding must be STANDARD, SMALL or NONE");
        }
        if (BRANDING_NONE.equals(branding) && !securityUtils.isSuperAdmin()) {
            throw new GendoxRuntimeException(HttpStatus.FORBIDDEN, "BRANDING_NOT_IN_PLAN",
                    "Removing the Gendox branding comes with exclusive plans; Gendox turns it on");
        }
        return branding;
    }

    private static void requireLength(String text, int max, String what) {
        if (text != null && text.length() > max) {
            throw invalid("CHAT_SETTING_TOO_LONG", what + " can be at most " + max + " characters");
        }
    }

    private static void requireColor(String color, String which) {
        if (color != null && !HEX_COLOR.matcher(color).matches()) {
            throw invalid("INVALID_CHAT_COLOR", "The " + which + " colour must be a hex colour such as #127A5B");
        }
    }

    private static GendoxRuntimeException invalid(String code, String message) {
        return new GendoxRuntimeException(HttpStatus.BAD_REQUEST, code, message);
    }
}
