package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.assistant;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.node.TextNode;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.AiModelMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.ToolExecutionContext;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectAgent;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Task;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.UserProfile;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.DocumentInstanceRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.MessageRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.TaskNodeRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.TaskRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.services.UserService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AssistantToolSupportTest {

    @Mock private UserService userService;
    @Mock private SecurityUtils securityUtils;
    @Mock private MessageRepository messageRepository;
    @Mock private TaskRepository taskRepository;
    @Mock private TaskNodeRepository taskNodeRepository;
    @Mock private DocumentInstanceRepository documentInstanceRepository;

    private AssistantToolSupport support;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Project project = new Project();

    @BeforeEach
    void setUp() {
        support = new AssistantToolSupport(objectMapper, userService, securityUtils, messageRepository,
                taskRepository, taskNodeRepository, documentInstanceRepository, null);
        project.setId(UUID.randomUUID());
    }

    @AfterEach
    void clear() {
        SecurityContextHolder.clearContext();
        RequestContextHolder.resetRequestAttributes();
    }

    private ToolExecutionContext context(List<AiModelMessage> previousMessages) {
        return new ToolExecutionContext(project, null, null, previousMessages, null, null);
    }

    private ToolExecutionContext context(ProjectAgent agent, List<AiModelMessage> previousMessages) {
        return new ToolExecutionContext(project, agent, null, previousMessages, null, null);
    }

    private static void inARequest() {
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(new MockHttpServletRequest()));
    }

    private static void signedIn(UserProfile user) {
        SecurityContextHolder.getContext().setAuthentication(new TestingAuthenticationToken(user, null));
    }

    // ------------------------------------------------------------------ typed arguments

    record Args(UUID task_id, Integer page) {
    }

    @Test
    void argumentsArriveAsAJsonStringAndAreReadIntoARecord() throws GendoxException {
        UUID taskId = UUID.randomUUID();

        Args args = support.readArguments(TextNode.valueOf("{\"task_id\":\"" + taskId + "\",\"page\":2}"), Args.class);

        assertEquals(taskId, args.task_id());
        assertEquals(2, args.page());
        assertNull(support.readArguments(TextNode.valueOf(""), Args.class).task_id());
    }

    @Test
    void badArgumentsAreAToolErrorNotACrash() {
        GendoxException e = assertThrows(GendoxException.class,
                () -> support.readArguments(TextNode.valueOf("{\"task_id\":\"not-a-uuid\"}"), Args.class));
        assertEquals("INVALID_TOOL_ARGUMENTS", e.getErrorCode());
    }

    // ------------------------------------------------------------------ access

    @Test
    void inARequestTheSignedInUserIsChecked() throws GendoxException {
        UserProfile user = mock(UserProfile.class);
        inARequest();
        signedIn(user);
        when(securityUtils.hasAuthority(eq(user), eq("OP_UPDATE_PROJECT"),
                argThat(criteria -> criteria.getProjectIds().contains(project.getId().toString())))).thenReturn(true);

        support.requireProjectMember(context(List.of()));

        verifyNoInteractions(userService, messageRepository);
    }

    @Test
    void inARequestAUserWhoCannotUpdateTheProjectIsRefused() {
        UserProfile user = mock(UserProfile.class);
        inARequest();
        signedIn(user);
        when(securityUtils.hasAuthority(eq(user), eq("OP_UPDATE_PROJECT"), any())).thenReturn(false);

        GendoxException e = assertThrows(GendoxException.class, () -> support.requireProjectMember(context(List.of())));
        assertEquals("FORBIDDEN_SIGN_IN_AS_PROJECT_MEMBER", e.getErrorCode());
        assertEquals(HttpStatus.FORBIDDEN, e.getHttpStatus());
    }

    @Test
    void anAnonymousRequestIsRefused() {
        inARequest();
        SecurityContextHolder.getContext().setAuthentication(new AnonymousAuthenticationToken("key", "anonymousUser",
                AuthorityUtils.createAuthorityList("ROLE_ANONYMOUS")));

        assertThrows(GendoxException.class, () -> support.requireProjectMember(context(List.of())));
        verifyNoInteractions(securityUtils, messageRepository);
    }

    @Test
    void aBackgroundJobActsForTheUserWhoStartedIt() throws GendoxException {
        UUID promptId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        Message prompt = new Message();
        prompt.setCreatedBy(userId);
        when(messageRepository.findById(promptId)).thenReturn(Optional.of(prompt));
        UserProfile user = mock(UserProfile.class);
        when(userService.getUserProfileByUserId(userId)).thenReturn(user);
        when(securityUtils.hasAuthority(eq(user), eq("OP_UPDATE_PROJECT"), any())).thenReturn(true);

        AiModelMessage stored = AiModelMessage.builder().id(promptId).role("user").build();
        AiModelMessage warning = AiModelMessage.builder().role("user").content("SYSTEM WARNING").build();
        support.requireProjectMember(context(List.of(stored, warning)));
    }

    @Test
    void aBackgroundJobAnAnonymousVisitorStartedIsRefused() {
        UUID promptId = UUID.randomUUID();
        when(messageRepository.findById(promptId)).thenReturn(Optional.of(new Message()));

        AiModelMessage stored = AiModelMessage.builder().id(promptId).role("user").build();
        assertThrows(GendoxException.class, () -> support.requireProjectMember(context(List.of(stored))));
        verifyNoInteractions(userService, securityUtils);
    }

    @Test
    void aTaskRunWhosePromptTheAgentWroteIsRefused() {
        ProjectAgent agent = new ProjectAgent();
        agent.setUserId(UUID.randomUUID());
        UUID promptId = UUID.randomUUID();
        Message prompt = new Message();
        prompt.setCreatedBy(agent.getUserId());
        when(messageRepository.findById(promptId)).thenReturn(Optional.of(prompt));

        AiModelMessage stored = AiModelMessage.builder().id(promptId).role("user").build();
        assertThrows(GendoxException.class, () -> support.requireProjectMember(context(agent, List.of(stored))));
        verifyNoInteractions(userService, securityUtils);
    }

    @Test
    void aTaskOfAnotherProjectReadsAsNotFound() {
        Task foreign = new Task();
        foreign.setId(UUID.randomUUID());
        foreign.setProjectId(UUID.randomUUID());
        when(taskRepository.findById(foreign.getId())).thenReturn(Optional.of(foreign));

        GendoxException e = assertThrows(GendoxException.class, () -> support.loadTask(context(List.of()), foreign.getId()));
        assertEquals("TASK_NOT_FOUND", e.getErrorCode());
    }

    // ------------------------------------------------------------------ result shapes

    @Test
    void slicesALongTextUntilNextOffsetIsNull() {
        String text = "a".repeat(1300);
        StringBuilder read = new StringBuilder();
        Integer offset = 0;
        int calls = 0;
        while (offset != null) {
            ObjectNode slice = support.slice(text, offset, 500);
            assertEquals(1300, slice.get("total_chars").asInt());
            read.append(slice.get("text").asText());
            offset = slice.get("next_offset").isNull() ? null : slice.get("next_offset").asInt();
            calls++;
        }
        assertEquals(text, read.toString());
        assertEquals(3, calls);
    }

    @Test
    void sliceClampsItsArgumentsAndNeverSplitsASurrogatePair() {
        String text = "x".repeat(20_000);
        assertEquals(AssistantToolSupport.DEFAULT_SLICE_CHARS, support.slice(text, null, null).get("text").asText().length());
        assertEquals(AssistantToolSupport.MAX_SLICE_CHARS, support.slice(text, 0, 1_000_000).get("text").asText().length());
        assertEquals(AssistantToolSupport.MIN_SLICE_CHARS, support.slice(text, 0, 1).get("text").asText().length());
        assertTrue(support.slice("short", 99, 1000).get("next_offset").isNull());

        ObjectNode first = support.slice("a".repeat(499) + "😀" + "b".repeat(600), 0, 500);
        assertEquals(499, first.get("next_offset").asInt());
    }

    @Test
    void pagesAreClamped() {
        assertEquals(0, AssistantToolSupport.page(-3));
        assertEquals(AssistantToolSupport.DEFAULT_PAGE_SIZE, AssistantToolSupport.size(null));
        assertEquals(AssistantToolSupport.MAX_PAGE_SIZE, AssistantToolSupport.size(500));
        assertTrue(support.pageResult(List.of(), 1, 20, 41).get("has_more").asBoolean());
        assertFalse(support.pageResult(List.of(), 2, 20, 41).get("has_more").asBoolean());
    }
}
