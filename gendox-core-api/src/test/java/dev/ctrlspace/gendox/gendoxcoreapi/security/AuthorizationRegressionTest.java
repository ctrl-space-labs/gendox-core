package dev.ctrlspace.gendox.gendoxcoreapi.security;

import dev.ctrlspace.gendox.authentication.GendoxAuthenticationToken;
import dev.ctrlspace.gendox.authentication.JwtUserProfileConversionFilter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.controller.*;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.*;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.*;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.ProjectAgentPredicates;
import dev.ctrlspace.gendox.gendoxcoreapi.services.*;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.*;
import dev.ctrlspace.gendox.spring.batch.services.DeepThinkingBatchService;
import dev.ctrlspace.gendox.spring.batch.utils.JobUtils;
import org.junit.jupiter.api.*;
import org.springframework.batch.core.launch.JobOperator;
import org.springframework.context.annotation.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.mock.web.*;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.context.request.*;
import org.springframework.web.servlet.HandlerMapping;
import org.slf4j.LoggerFactory;
import java.time.Instant;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

/** Regression coverage for request identity, tenant boundaries and credential disclosure. */
class AuthorizationRegressionTest {
    final UUID org = UUID.randomUUID(), project = UUID.randomUUID(), user = UUID.randomUUID();
    final UserProfile profile = new UserProfile();
    final SecurityUtils security = new SecurityUtils(mock(ChatThreadRepository.class), mock(ProjectAgentService.class),
            mock(DocumentInstanceRepository.class), mock(UserOrganizationService.class), mock(MessageLocalContextService.class),
            mock(ChatThreadDocumentsRepository.class), mock(TaskRepository.class), mock(TaskNodeRepository.class));
    final List<AnnotationConfigApplicationContext> contexts = new ArrayList<>();
    MockHttpServletRequest request;

    @Configuration @EnableMethodSecurity static class MethodSecurity {}

    @BeforeEach void setup() {
        Type type = new Type(); type.setName("GENDOX_USER");
        profile.setId(user.toString()); profile.setGlobalUserRoleType(type);
        OrganizationUserDTO membership = new OrganizationUserDTO(); membership.setId(org.toString());
        membership.setAuthorities(Set.of("OP_READ_DOCUMENT", "OP_WRITE_DOCUMENT", "OP_UPDATE_PROJECT", "OP_ADD_USERS"));
        membership.setProjects(List.of(ProjectOrganizationDTO.builder().id(project.toString()).build()));
        profile.setOrganizations(List.of(membership));
        SecurityContextHolder.getContext().setAuthentication(new GendoxAuthenticationToken(profile, null, List.of()));
        request = new MockHttpServletRequest();
        request.addParameter("projectId", project.toString());
        request.addParameter("organizationId", org.toString());
        request.setAttribute(HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE,
                Map.of("projectId", project.toString(), "organizationId", org.toString(), "documentId", UUID.randomUUID().toString(), "threadId", UUID.randomUUID().toString()));
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));
    }

    <T> T guarded(Class<T> clazz, T instance) {
        AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext();
        context.getEnvironment().getPropertySources().addFirst(new org.springframework.core.env.MapPropertySource("review", Map.of("proven-ai.enabled", "false", "gendox.documents.allowed.extensions", ".txt,.pdf")));
        context.register(MethodSecurity.class);
        context.registerBean("securityUtils", SecurityUtils.class, () -> security);
        context.registerBean("reviewTarget", clazz, () -> instance);
        context.refresh(); contexts.add(context);
        return context.getBean("reviewTarget", clazz);
    }
    @AfterEach void cleanup() {
        contexts.forEach(AnnotationConfigApplicationContext::close);
        SecurityContextHolder.clearContext(); RequestContextHolder.resetRequestAttributes();
    }

    @Test void completionRejectsForeignThreadBeforeAnySideEffect() throws Exception {
        ProjectService projects = mock(ProjectService.class);
        Project p = new Project(); p.setId(project); p.setOrganizationId(org);
        ProjectAgent agent = new ProjectAgent(); agent.setCompletionModel(new AiModel()); p.setProjectAgent(agent);
        when(projects.getProjectById(project)).thenReturn(p);
        SubscriptionValidationService limits = mock(SubscriptionValidationService.class);
        when(limits.canSendMessage(any(), any())).thenReturn(true);
        MessageService messages = mock(MessageService.class);
        when(messages.createMessage(any())).thenAnswer(i -> i.getArgument(0));
        MessageLocalContextConverter converter = mock(MessageLocalContextConverter.class);
        when(converter.toEntities(any(), any())).thenReturn(List.of());
        MessageLocalContextService local = mock(MessageLocalContextService.class);
        when(local.buildContextsFromDocumentIds(any(), any(), any())).thenReturn(List.of());
        when(local.getImageContentPartsFromLocalContext(any())).thenReturn(List.of());
        CompletionTurnService turns = mock(CompletionTurnService.class);
        EmbeddingsController c = guarded(EmbeddingsController.class, new EmbeddingsController(
                mock(EmbeddingService.class), mock(TrainingService.class), mock(CompletionService.class), messages,
                mock(OrganizationModelKeyService.class), limits, projects, converter, local,
                mock(DeepThinkingBatchService.class), turns, mock(DocumentSectionService.class), security, Runnable::run));
        UUID victimThread = UUID.randomUUID();
        CompletionRequestDTO dto = new CompletionRequestDTO(); dto.setThreadId(victimThread); dto.setValue("read previous messages");
        assertThrows(GendoxException.class, () -> c.getCompletionSearch(dto, project.toString(), SecurityContextHolder.getContext().getAuthentication(), request));
        verifyNoInteractions(turns, messages, local, projects);
    }

    @Test void foreignAttachmentIsRejectedBeforeItCanGrantThreadAccess() throws Exception {
        MessageService messages = mock(MessageService.class);
        MessageLocalContextService local = mock(MessageLocalContextService.class);
        CompletionTurnService turns = mock(CompletionTurnService.class);
        ProjectService projects = mock(ProjectService.class);
        EmbeddingsController controller = guarded(EmbeddingsController.class, new EmbeddingsController(
                mock(EmbeddingService.class), mock(TrainingService.class), mock(CompletionService.class), messages,
                mock(OrganizationModelKeyService.class), mock(SubscriptionValidationService.class), projects,
                mock(MessageLocalContextConverter.class), local, mock(DeepThinkingBatchService.class), turns,
                mock(DocumentSectionService.class), security, Runnable::run));
        CompletionRequestDTO dto = new CompletionRequestDTO(); dto.setValue("read attachment");
        dto.setDocumentInstanceIds(List.of(UUID.randomUUID()));
        assertThrows(GendoxException.class, () -> controller.getCompletionSearch(dto, project.toString(),
                SecurityContextHolder.getContext().getAuthentication(), request));
        verifyNoInteractions(messages, local, turns, projects);
    }

    @Test void jobRejectsForeignQueryProject() throws Exception {
        JobService jobs = mock(JobService.class);
        JobController c = guarded(JobController.class, new JobController(jobs, security, mock(TaskService.class),
                mock(JobUtils.class), mock(JobOperator.class), mock(DeepThinkingStepService.class)));
        UUID foreignProject = UUID.randomUUID();
        assertThrows(GendoxException.class, () -> c.triggerAsyncJob(org, project, "TRAINING", foreignProject, null));
        verifyNoInteractions(jobs);
        assertThrows(GendoxException.class, () -> c.triggerAsyncJob(org, project, "TRAINING", null, null));
        verifyNoInteractions(jobs);
        c.triggerAsyncJob(org, project, "TRAINING", project, null);
        verify(jobs).executeTraining(project, null);
        profile.getGlobalUserRoleType().setName("GENDOX_SUPER_ADMIN");
        c.triggerAsyncJob(org, project, "TRAINING", null, null);
        verify(jobs).executeTraining(null, null);
    }

    @Test void projectListingIntersectsClientIdsWithMembership() throws Exception {
        ProjectService projects = mock(ProjectService.class);
        ProjectController c = new ProjectController(projects, mock(ProjectConverter.class), mock(ProjectMemberService.class),
                mock(ProjectMemberConverter.class), mock(ProjectAgentService.class), security, mock(UserService.class));
        UUID foreignProject = UUID.randomUUID(); ProjectCriteria criteria = new ProjectCriteria();
        criteria.getProjectIdIn().add(foreignProject.toString());
        c.getAllProjects(criteria, org.toString(), PageRequest.of(0, 20), SecurityContextHolder.getContext().getAuthentication());
        assertTrue(criteria.getProjectIdIn().isEmpty());
        verifyNoInteractions(projects);
        assertNull(criteria.getPrivateProjectAgent());
    }

    @Test void agentPredicateAppliesAuthorizationAgentIds() {
        ProjectAgentCriteria criteria = new ProjectAgentCriteria(); criteria.setOrganizationId(org.toString());
        String initial = ProjectAgentPredicates.build(criteria).toString();
        criteria.setAgentIdIn(List.of(UUID.randomUUID()));
        assertNotEquals(initial, ProjectAgentPredicates.build(criteria).toString());
    }

    @Test void documentStorageUrlCannotBeRedirectedToServerFiles() throws Exception {
        DocumentService documents = mock(DocumentService.class);
        UUID documentId = UUID.randomUUID();
        DocumentInstance existing = new DocumentInstance(); existing.setId(documentId); existing.setOrganizationId(org);
        existing.setRemoteUrl("file:/managed/own/document.txt");
        when(documents.getDocumentInstanceById(documentId)).thenReturn(existing);
        DocumentController controller = new DocumentController(documents, new DocumentInstanceConverter(mock(DocumentInstanceSectionWithoutDocumentConverter.class)),
                mock(UploadService.class), mock(SplitFileService.class), mock(DocumentSectionService.class),
                mock(DocumentInstanceSectionWithoutDocumentConverter.class), mock(DocumentOnlyConverter.class),
                mock(dev.ctrlspace.gendox.gendoxcoreapi.messages.postgres.QueueProducerService.class), "uploads", security);
        DocumentInstanceDTO dto = DocumentInstanceDTO.builder().id(documentId).remoteUrl("file:/outside/secret.txt").build();
        assertThrows(GendoxException.class, () -> controller.update(null, documentId, dto));
        verify(documents, never()).updateDocument(any());
        dto.setId(null); dto.setOrganizationId(org);
        assertThrows(GendoxException.class, () -> controller.create(dto, org));
        verify(documents, never()).createDocumentInstance(any());
    }

    @Test void taskCreationRejectsForeignProjectsAndExistingIds() throws Exception {
        TaskRepository repository = mock(TaskRepository.class);
        when(repository.save(any())).thenAnswer(i -> i.getArgument(0));
        TypeService types = mock(TypeService.class); Type taskType = new Type(); taskType.setName("DOCUMENT_INSIGHTS");
        when(types.getTaskTypeByName("DOCUMENT_INSIGHTS")).thenReturn(taskType);
        TaskService service = mock(TaskService.class, CALLS_REAL_METHODS);
        ReflectionTestUtils.setField(service, "logger", LoggerFactory.getLogger(TaskService.class));
        ReflectionTestUtils.setField(service, "taskRepository", repository);
        ReflectionTestUtils.setField(service, "taskConverter", new TaskConverter(types, mock(AiModelService.class)));
        ReflectionTestUtils.setField(service, "maxQuestionsPerBucket", 5);
        ReflectionTestUtils.setField(service, "maxQuestionTokensPerBucket", 100);
        ReflectionTestUtils.setField(service, "maxSectionsChunkTokens", 100);
        UUID foreignProject = UUID.randomUUID(), victimTask = UUID.randomUUID();
        TaskDTO dto = TaskDTO.builder().id(victimTask).projectId(foreignProject).type("DOCUMENT_INSIGHTS").title("replacement").build();
        assertThrows(GendoxException.class, () -> taskController(service).createTask(org, project, dto));
        dto.setId(null);
        assertThrows(GendoxException.class, () -> taskController(service).createTask(org, project, dto));
        verifyNoInteractions(repository);
        dto.setProjectId(null);
        assertEquals(project, taskController(service).createTask(org, project, dto).getProjectId());
    }

    @Test void invitationAcceptanceRejectsExpiredOrReusedTokens() throws Exception {
        InvitationRepository repository = mock(InvitationRepository.class);
        Invitation invitation = new Invitation(); invitation.setOrganizationId(org); invitation.setProjectId(project);
        invitation.setExpiresAt(Instant.EPOCH); Type expired = new Type(); expired.setName("EXPIRED"); invitation.setStatusType(expired);
        when(repository.findByInviteeEmailAndToken("review@example.invalid", "canary")).thenReturn(Optional.of(invitation));
        when(repository.save(any())).thenAnswer(i -> i.getArgument(0));
        TypeService types = mock(TypeService.class); Type accepted = new Type(); accepted.setName("ACCEPTED");
        when(types.getEmailInvitationStatusByName("ACCEPTED")).thenReturn(accepted);
        SubscriptionValidationService limits = mock(SubscriptionValidationService.class); when(limits.canInviteUsers(org)).thenReturn(true);
        UserService users = mock(UserService.class); when(users.getOptionalByEmail(any())).thenReturn(Optional.empty());
        UserInvitationService service = new UserInvitationService(repository, types, mock(UserOrganizationService.class),
                mock(OrganizationService.class), users, mock(ProjectMemberService.class), mock(EmailService.class),
                mock(org.thymeleaf.TemplateEngine.class), limits);
        assertThrows(GendoxException.class, () -> service.acceptInvitation("review@example.invalid", "canary"));
        invitation.setExpiresAt(Instant.now().plusSeconds(300)); invitation.setStatusType(accepted);
        assertThrows(GendoxException.class, () -> service.acceptInvitation("review@example.invalid", "canary"));
        verify(repository, never()).save(any());
    }

    @Test void jwtPrincipalIsBoundToSubjectRegardlessOfUsername() throws Exception {
        UserService users = mock(UserService.class); 
        JwtDTOUserProfileConverter converter = mock(JwtDTOUserProfileConverter.class); JwtDTO dto = new JwtDTO();
        when(converter.jwtDTO(profile)).thenReturn(dto);
        JWTUtils jwtUtils = mock(JWTUtils.class); when(jwtUtils.getAuthorities(dto)).thenReturn(List.of());
        JwtUserProfileConversionFilter filter = new JwtUserProfileConversionFilter(users, converter, jwtUtils);
        UUID victimId = UUID.randomUUID();
        when(users.getUserProfileByUserId(user)).thenReturn(profile);
        Jwt jwt = Jwt.withTokenValue("review-only").header("alg", "RS256").subject(user.toString())
                .claim("preferred_username", victimId.toString()).build();
        SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(jwt));
        filter.doFilter(new MockHttpServletRequest(), new MockHttpServletResponse(), new MockFilterChain());
        UserProfile result = (UserProfile) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        assertEquals(user.toString(), result.getId());
        verify(users).getUserProfileByUserId(user);
        verify(users, never()).getUserProfileByUniqueIdentifier(any());
    }

    @Test void metadataRejectsAMessageOutsideTheAuthorizedThread() throws Exception {
        UUID ownedThread = UUID.randomUUID(), foreignMessage = UUID.randomUUID();
        request.setAttribute(HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE, Map.of("threadId", ownedThread.toString()));
        ChatThreadRepository threads = (ChatThreadRepository) ReflectionTestUtils.getField(security, "chatThreadRepository");
        when(threads.existsByIdAndProjectIdIn(eq(ownedThread), anyList())).thenReturn(true);
        MessageService messages = mock(MessageService.class);
        ChatThreadController c = guarded(ChatThreadController.class, new ChatThreadController(mock(ChatThreadService.class), security,
                messages, mock(MessageLocalContextService.class)));
        assertThrows(GendoxException.class, () -> c.getThreadMessageMetadataByMessageId(ownedThread, foreignMessage));
        verify(messages, never()).getAllMessagesMetadataByMessageId(any());
        when(messages.areAllMessagesInThread(ownedThread, List.of(foreignMessage))).thenReturn(true);
        c.getThreadMessageMetadataByMessageId(ownedThread, foreignMessage);
        verify(messages).getAllMessagesMetadataByMessageId(foreignMessage);
    }

    @Test void sectionOrderRejectsForeignMetadataBeforeAnyWrite() throws Exception {
        DocumentSectionMetadataRepository repository = mock(DocumentSectionMetadataRepository.class);
        DocumentSectionMetadata victim = new DocumentSectionMetadata(); victim.setId(UUID.randomUUID());
        when(repository.findById(victim.getId())).thenReturn(Optional.of(victim));
        DocumentSectionService service = mock(DocumentSectionService.class, CALLS_REAL_METHODS);
        ReflectionTestUtils.setField(service, "documentSectionMetadataRepository", repository);
        DocumentInstanceSectionOrderDTO order = new DocumentInstanceSectionOrderDTO();
        order.setDocumentSectionMetadataId(victim.getId()); order.setSectionOrder(999);
        doReturn(List.of()).when(service).getSectionsByDocument(any());
        assertThrows(GendoxException.class, () -> documentController(service).updateSectionsOrder(null, UUID.randomUUID(), List.of(order)));
        verifyNoInteractions(repository);
    }

    @Test void taskDuplicationRejectsForeignSourceBeforePersistence() throws Exception {
        TaskRepository repository = mock(TaskRepository.class);
        Task victim = new Task(); victim.setId(UUID.randomUUID()); victim.setProjectId(UUID.randomUUID());
        Type type = new Type(); type.setName("DOCUMENT_INSIGHTS"); victim.setTaskType(type);
        victim.setTitle("foreign title"); victim.setTaskPrompt("foreign private prompt");
        when(repository.findById(victim.getId())).thenReturn(Optional.of(victim));
        when(repository.save(any())).thenAnswer(i -> i.getArgument(0));
        TypeService types = mock(TypeService.class); when(types.getTaskTypeByName("DOCUMENT_INSIGHTS")).thenReturn(type);
        TaskService service = new TaskService(repository, mock(TaskNodeRepository.class), types,
                mock(TaskEdgeService.class), mock(EOScriptService.class), mock(EOTaskGeometryService.class),
                new TaskConverter(types, mock(AiModelService.class)), mock(AiModelService.class), mock(TaskNodeService.class),
                mock(ProjectService.class), mock(SubscriptionAiModelTierService.class), 5, 100, 100);
        assertThrows(GendoxException.class, () -> taskController(service).duplicateTask(org, project, TaskDuplicateDTO.builder().taskId(victim.getId()).build()));
        verify(repository, never()).save(any());
    }

    @Test void editorCannotInviteAnOwner() throws Exception {
        InvitationRepository repository = mock(InvitationRepository.class);
        when(repository.save(any())).thenAnswer(i -> i.getArgument(0));
        TypeService types = mock(TypeService.class); Type owner = new Type(); owner.setName("ROLE_OWNER");
        Type pending = new Type(); pending.setName("PENDING");
        when(types.getOrganizationRolesByName("ROLE_OWNER")).thenReturn(owner);
        when(types.getEmailInvitationStatusByName("PENDING")).thenReturn(pending);
        SubscriptionValidationService limits = mock(SubscriptionValidationService.class); when(limits.canInviteUsers(org)).thenReturn(true);
        UserService users = mock(UserService.class); when(users.getOptionalByEmail(any())).thenReturn(Optional.empty());
        OrganizationService organizations = mock(OrganizationService.class); Organization own = new Organization(); own.setName("review");
        when(organizations.getById(org)).thenReturn(own);
        UserOrganizationService memberships = mock(UserOrganizationService.class);
        Type editor = new Type(); editor.setName("ROLE_EDITOR");
        when(memberships.getUserOrganizationRoleType(user, org)).thenReturn(editor);
        profile.getOrganizations().getFirst().setAuthorities(Set.of("OP_ADD_USERS", "OP_ADD_PROJECT_MEMBERS"));
        UserInvitationService service = new UserInvitationService(repository, types, memberships, organizations,
                users, mock(ProjectMemberService.class), mock(EmailService.class), mock(org.thymeleaf.TemplateEngine.class), limits);
        ReflectionTestUtils.setField(service, "acceptUrlTemplate", "/accept?email=%s&token=%s");
        InvitationController c = guarded(InvitationController.class, new InvitationController(service, limits, mock(ProjectService.class), memberships, security));
        Invitation input = new Invitation(); input.setOrganizationId(org); input.setProjectId(project);
        input.setInviteeEmail("review@example.invalid"); input.setUserRoleType(owner);
        assertThrows(GendoxException.class, () -> c.inviteUser(org.toString(), input, SecurityContextHolder.getContext().getAuthentication()));
        verify(repository, never()).save(any());
    }


    @Test void readOnlyMemberReceivesNoConnectorSecret() throws Exception {
        profile.getOrganizations().getFirst().setAuthorities(Set.of("OP_READ_DOCUMENT"));
        OrganizationConnector connector = new OrganizationConnector(); connector.setOrganizationId(org);
        connector.setConfig("{\"apiKey\":\"review-canary\"}");
        OrganizationConnectorService service = mock(OrganizationConnectorService.class);
        when(service.getAllByOrganizationId(org)).thenReturn(List.of(connector));
        OrganizationConnectorController c = guarded(OrganizationConnectorController.class,
                new OrganizationConnectorController(service, new OrganizationConnectorConverter(new com.fasterxml.jackson.databind.ObjectMapper())));
        assertNull(c.getConnectors(org).getFirst().getConfig().get("apiKey"));
    }


    @Test void threadAccessPreservesAuthorizedAndPublicFlows() throws Exception {
        ChatThreadRepository threads = (ChatThreadRepository) ReflectionTestUtils.getField(security, "chatThreadRepository");
        ProjectAgentService agents = (ProjectAgentService) ReflectionTestUtils.getField(security, "projectAgentService");
        ChatThread thread = new ChatThread(); thread.setId(UUID.randomUUID()); thread.setProjectId(project);
        when(threads.findById(thread.getId())).thenReturn(Optional.of(thread));
        assertDoesNotThrow(() -> security.requireThreadInProject(thread.getId(), project));
        SecurityContextHolder.clearContext();
        assertThrows(GendoxException.class, () -> security.requireThreadInProject(thread.getId(), project));
        thread.setPublicThread(true); when(agents.isPublicAgent(project)).thenReturn(true);
        assertDoesNotThrow(() -> security.requireThreadInProject(thread.getId(), project));
        assertThrows(GendoxException.class, () -> security.requireThreadInProject(thread.getId(), UUID.randomUUID()));
    }

    @Test void authorizedAttachmentIsStillBuiltAndUnknownDocumentsAreRejected() throws Exception {
        DocumentInstanceRepository ownership = (DocumentInstanceRepository) ReflectionTestUtils.getField(security, "documentInstanceRepository");
        DocumentInstanceRepository repository = mock(DocumentInstanceRepository.class);
        DocumentInstance document = new DocumentInstance(); document.setId(UUID.randomUUID()); document.setOrganizationId(org);
        when(ownership.areAllDocumentIdsInProjectsOrChats(any(), any())).thenReturn(true);
        when(repository.findAllById(List.of(document.getId()))).thenReturn(List.of(document));
        Message message = new Message(); message.setProjectId(project);
        MessageLocalContextService service = new MessageLocalContextService(repository, mock(MessageLocalContextRepository.class), mock(DownloadService.class));
        assertEquals(document, service.buildContextsFromDocumentIds(message, List.of(document.getId()), "ATTACHED_DOCUMENT").getFirst().getDocument());
        assertThrows(GendoxException.class, () -> service.buildContextsFromDocumentIds(message, List.of(UUID.randomUUID()), "ATTACHED_DOCUMENT"));
    }

    @Test void taskUpdateCannotMoveAnOwnedTaskToAnotherProject() throws Exception {
        TaskRepository repository = mock(TaskRepository.class);
        Task task = new Task(); task.setId(UUID.randomUUID()); task.setProjectId(project);
        when(repository.findById(task.getId())).thenReturn(Optional.of(task));
        TaskService service = new TaskService(repository, mock(TaskNodeRepository.class), mock(TypeService.class),
                mock(TaskEdgeService.class), mock(EOScriptService.class), mock(EOTaskGeometryService.class),
                mock(TaskConverter.class), mock(AiModelService.class), mock(TaskNodeService.class),
                mock(ProjectService.class), mock(SubscriptionAiModelTierService.class), 5, 100, 100);
        assertThrows(GendoxException.class, () -> taskController(service).updateTask(org, project, task.getId(), TaskDTO.builder().projectId(UUID.randomUUID()).build()));
        assertEquals(project, task.getProjectId()); verify(repository, never()).save(any());
    }

    TaskController taskController(TaskService service) {
        return new TaskController(service, mock(TaskNodeConverter.class), mock(TaskEdgeConverter.class),
                mock(TaskCsvExportService.class), mock(TaskNodeService.class), mock(TaskEdgeService.class),
                mock(InsightQuestionService.class), security);
    }
    DocumentController documentController(DocumentSectionService sections) {
        return new DocumentController(mock(DocumentService.class), mock(DocumentInstanceConverter.class),
                mock(UploadService.class), mock(SplitFileService.class), sections,
                mock(DocumentInstanceSectionWithoutDocumentConverter.class), mock(DocumentOnlyConverter.class),
                mock(dev.ctrlspace.gendox.gendoxcoreapi.messages.postgres.QueueProducerService.class), "uploads", security);
    }

    @Test void duplicationChecksCopiedSupportingDocumentsBeforeCreatingTheTask() throws Exception {
        TaskService tasks = mock(TaskService.class); TaskNodeService nodes = mock(TaskNodeService.class, CALLS_REAL_METHODS);
        ReflectionTestUtils.setField(nodes, "securityUtils", security);
        Task original = new Task(); original.setId(UUID.randomUUID()); original.setProjectId(project);
        when(tasks.getTaskById(original.getId())).thenReturn(original);
        TaskDocumentMetadataDTO metadata = new TaskDocumentMetadataDTO(); metadata.setSupportingDocumentIds(List.of(UUID.randomUUID()));
        TaskNodeValueDTO value = new TaskNodeValueDTO(); value.setDocumentMetadata(metadata);
        TaskNode question = new TaskNode(); question.setNodeValue(value);
        doReturn(new org.springframework.data.domain.PageImpl<>(List.of(question))).when(nodes).getTaskNodesByType(original.getId(), "QUESTION");
        TaskController c = new TaskController(tasks, mock(TaskNodeConverter.class), mock(TaskEdgeConverter.class),
                mock(TaskCsvExportService.class), nodes, mock(TaskEdgeService.class), mock(InsightQuestionService.class), security);
        TaskDuplicateDTO dto = TaskDuplicateDTO.builder().taskId(original.getId()).keepQuestions(true).build();
        assertThrows(GendoxException.class, () -> c.duplicateTask(org, project, dto));
        verify(tasks, never()).duplicateTask(any(), any());
    }

    @Test void uploadValidatesTheThreadBeforeCallingTheUploadService() throws Exception {
        DocumentController c = documentController(mock(DocumentSectionService.class));
        DocumentService documents = (DocumentService) ReflectionTestUtils.getField(c, "documentService");
        MockMultipartFile file = new MockMultipartFile("file", "note.txt", "text/plain", "note".getBytes());
        assertThrows(GendoxException.class, () -> c.uploadSingleFile(file, true, UUID.randomUUID(), org, project));
        verifyNoInteractions(documents);
    }

    @Test void sectionMetadataIsBoundToItsSectionBeforeCallingTheUpdateService() throws Exception {
        DocumentSectionService sections = mock(DocumentSectionService.class);
        DocumentController c = documentController(sections);
        UUID sectionId = UUID.randomUUID(), documentId = UUID.randomUUID();
        DocumentInstance document = new DocumentInstance(); document.setId(documentId);
        DocumentSectionMetadata owned = new DocumentSectionMetadata(); owned.setId(UUID.randomUUID());
        DocumentSectionMetadata foreign = new DocumentSectionMetadata(); foreign.setId(UUID.randomUUID());
        DocumentInstanceSection existing = new DocumentInstanceSection(); existing.setId(sectionId);
        existing.setDocumentInstance(document); existing.setDocumentSectionMetadata(owned);
        DocumentInstanceSection updated = new DocumentInstanceSection(); updated.setId(sectionId); updated.setDocumentSectionMetadata(foreign);
        when(sections.getSectionById(sectionId)).thenReturn(existing);
        DocumentInstanceSectionWithoutDocumentConverter sectionConverter = (DocumentInstanceSectionWithoutDocumentConverter)
                ReflectionTestUtils.getField(c, "documentInstanceSectionWithoutDocumentConverter");
        DocumentInstanceConverter documentConverter = (DocumentInstanceConverter) ReflectionTestUtils.getField(c, "documentInstanceConverter");
        when(sectionConverter.toEntity(any())).thenReturn(updated);
        when(documentConverter.toEntity(any())).thenReturn(document);
        assertThrows(GendoxException.class, () -> c.updateSection(null, sectionId, documentId, new DocumentInstanceSectionDTO()));
        verify(sections, never()).updateSection(any());
    }

    EmbeddingsController searchController(MessageService messages, EmbeddingService embeddings) throws Exception {
        ProjectService projects = mock(ProjectService.class);
        Project selected = new Project(); selected.setId(project); selected.setOrganizationId(org);
        when(projects.getProjectById(project)).thenReturn(selected);
        return new EmbeddingsController(embeddings, mock(TrainingService.class), mock(CompletionService.class), messages,
                mock(OrganizationModelKeyService.class), mock(SubscriptionValidationService.class), projects,
                mock(MessageLocalContextConverter.class), mock(MessageLocalContextService.class), mock(DeepThinkingBatchService.class),
                mock(CompletionTurnService.class), mock(DocumentSectionService.class), security, Runnable::run);
    }

    @Test void searchPreservesTheOriginalMessageAndItsSupportedMetadata() throws Exception {
        MessageService messages = mock(MessageService.class); EmbeddingService embeddings = mock(EmbeddingService.class);
        EmbeddingsController controller = searchController(messages, embeddings);
        Message question = new Message(); question.setValue("question"); question.setRole("user");
        question.setCreatedBy(user); question.setUpdatedBy(user); question.setName("existing-name");
        question.setReasoningContent("existing metadata"); question.setAiModelId(UUID.randomUUID());
        when(messages.createMessage(same(question))).thenReturn(question);
        controller.findCloserSections(question, project.toString(), SecurityContextHolder.getContext().getAuthentication(),
                request, PageRequest.of(0, 5));
        verify(messages).createMessage(same(question));
        verify(embeddings).findClosestSections(same(question), any(), any());
        assertEquals("existing-name", question.getName());
        assertEquals("existing metadata", question.getReasoningContent());
        assertNotNull(question.getAiModelId());
        assertEquals(project, question.getProjectId());
    }

    @Test void searchRejectsSpoofedAuthorshipRolesAndForeignAttachmentsBeforeSaving() throws Exception {
        MessageService messages = mock(MessageService.class); EmbeddingService embeddings = mock(EmbeddingService.class);
        EmbeddingsController controller = searchController(messages, embeddings);
        Message question = new Message(); question.setValue("question"); question.setCreatedBy(UUID.randomUUID());
        assertThrows(GendoxException.class, () -> controller.findCloserSections(question, project.toString(),
                SecurityContextHolder.getContext().getAuthentication(), request, PageRequest.of(0, 5)));
        question.setCreatedBy(null); question.setRole("assistant");
        assertThrows(GendoxException.class, () -> controller.findCloserSections(question, project.toString(),
                SecurityContextHolder.getContext().getAuthentication(), request, PageRequest.of(0, 5)));
        question.setRole("user");
        DocumentInstance foreign = new DocumentInstance(); foreign.setId(UUID.randomUUID());
        MessageLocalContext context = new MessageLocalContext(); context.setDocument(foreign);
        question.setLocalContexts(List.of(context));
        assertThrows(GendoxException.class, () -> controller.findCloserSections(question, project.toString(),
                SecurityContextHolder.getContext().getAuthentication(), request, PageRequest.of(0, 5)));
        verifyNoInteractions(messages, embeddings);
    }

}
