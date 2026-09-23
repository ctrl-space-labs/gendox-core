package dev.ctrlspace.gendox.gendoxcoreapi.utils;


import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.UserOrganization;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.OrganizationUserDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.UserProfile;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.AccessCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ChatThreadDocumentsRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ChatThreadRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.DocumentInstanceRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.services.MessageLocalContextService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ProjectAgentService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.UserOrganizationService;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.TaskRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.TaskNodeRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.QueryParamNames;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.UserNamesConstants;
import jakarta.servlet.http.HttpServletRequest;
import org.apache.commons.codec.binary.Base32;
import org.jetbrains.annotations.Nullable;
import org.slf4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.servlet.HandlerMapping;

import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.*;
import java.util.stream.Collectors;

@Component("securityUtils")
public class SecurityUtils {

    private final ChatThreadDocumentsRepository chatThreadDocumentsRepository;
    private final TaskRepository taskRepository;
    private final TaskNodeRepository taskNodeRepository;
    Logger logger = org.slf4j.LoggerFactory.getLogger(SecurityUtils.class);

    private ChatThreadRepository chatThreadRepository;
    private ProjectAgentService projectAgentService;
    private DocumentInstanceRepository documentInstanceRepository;
    private UserOrganizationService userOrganizationService;
    private MessageLocalContextService messageLocalContextService;

    @Autowired
    public SecurityUtils(ChatThreadRepository chatThreadRepository,
                         ProjectAgentService projectAgentService,
                         DocumentInstanceRepository documentInstanceRepository,
                         UserOrganizationService userOrganizationService,
                         MessageLocalContextService messageLocalContextService,
                         ChatThreadDocumentsRepository chatThreadDocumentsRepository,
                         TaskRepository taskRepository,
                         TaskNodeRepository taskNodeRepository) {
        this.chatThreadRepository = chatThreadRepository;
        this.projectAgentService = projectAgentService;
        this.documentInstanceRepository = documentInstanceRepository;
        this.userOrganizationService = userOrganizationService;
        this.messageLocalContextService = messageLocalContextService;
        this.chatThreadDocumentsRepository = chatThreadDocumentsRepository;
        this.taskRepository = taskRepository;
        this.taskNodeRepository = taskNodeRepository;
    }


    public boolean isSuperAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Object principal = authentication != null ? authentication.getPrincipal() : null;

        if (!(principal instanceof UserProfile userProfile)) {
            logSuperAdminAccess(false, principal);
            return false;
        }

        boolean authorized = isSuperAdmin(userProfile);

        logSuperAdminAccess(authorized, userProfile);

        return authorized;
    }

    public boolean isSuperAdmin(UserProfile userProfile) {
        return userProfile != null &&
                UserNamesConstants.GENDOX_SUPER_ADMIN.equals(
                        userProfile.getGlobalUserRoleType().getName()
                );
    }

    private void logSuperAdminAccess(boolean authorized, Object principal) {
        HttpServletRequest request = getCurrentHttpRequest();
        String ip = request != null ? resolveClientIp(request) : null;
        String method = request != null ? request.getMethod() : null;
        String uri = request != null ? request.getRequestURI() : null;
        String query = request != null ? request.getQueryString() : null;
        String userAgent = request != null ? request.getHeader("User-Agent") : null;

        if (authorized) {
            logger.info("Authorized super-admin API access: principal={}, ip={}, method={}, uri={}, query={}, userAgent={}",
                    describePrincipal(principal), ip, method, uri, query, userAgent);
        } else {
            // isSuperAdmin() is also used as a plain boolean check (e.g. JobController), so a
            // negative result is the normal path for every regular user, not an access attempt.
            logger.trace("Super-admin check denied: principal={}, ip={}, method={}, uri={}, query={}, userAgent={}",
                    describePrincipal(principal), ip, method, uri, query, userAgent);
        }
    }

    /**
     * Compact principal descriptor. UserProfile.toString() expands every organization, project
     * and agent, which makes it unusable in a log line.
     */
    private String describePrincipal(Object principal) {
        if (principal instanceof UserProfile userProfile) {
            Type roleType = userProfile.getGlobalUserRoleType();
            return "UserProfile(id=" + userProfile.getId()
                    + ", email=" + userProfile.getEmail()
                    + ", globalRole=" + (roleType != null ? roleType.getName() : null) + ")";
        }
        return principal != null ? principal.toString() : null;
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        return request.getRemoteAddr();
    }

    public boolean isUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof UserProfile userProfile)) {
            return false;
        }
        return userProfile != null &&
                UserNamesConstants.GENDOX_USER.equals(
                        userProfile.getGlobalUserRoleType().getName()
                );
    }

    public boolean isAgent(Authentication authentication) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof UserProfile userProfile)) {
            return false;
        }

        return principal != null &&
                UserNamesConstants.GENDOX_AGENT.equals(
                        userProfile.getGlobalUserRoleType().getName()
                );
    }

    public boolean isOrganizationOwner() throws GendoxException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (!(authentication.getPrincipal() instanceof UserProfile userProfile)) {
            return false;
        }

        if (isSuperAdmin(userProfile)) {
            return true; // Skip validation if user is a super admin
        }

        UUID userId = this.getUserId();
        UserOrganization userOrganization = userOrganizationService.getUserOrganizationByOwnerId(userId);
        return userOrganization != null;
    }


    public boolean can(String authority, UserProfile userProfile, AccessCriteria accessCriteria) {

        // Check if projectIds is not null and not empty, then check project access
        if (accessCriteria.getProjectIds() != null && !accessCriteria.getProjectIds().isEmpty()) {
            return canAccessProjects(authority, userProfile, accessCriteria.getProjectIds());
        }

        // Check if orgIds is not null and not empty, then check organization access
        if (accessCriteria.getOrgIds() != null && !accessCriteria.getOrgIds().isEmpty()) {
            return canAccessOrganizations(authority, userProfile, accessCriteria.getOrgIds());
        }


        if (accessCriteria.getThreadId() != null && !accessCriteria.getThreadId().isEmpty()) {
            return canAccessThread(authority, userProfile, UUID.fromString(accessCriteria.getThreadId()));
        }

        if (accessCriteria.getTaskId() != null && !accessCriteria.getTaskId().isEmpty()) {
            return canAccessTask(authority, userProfile, UUID.fromString(accessCriteria.getTaskId()));
        }

        if (accessCriteria.getTaskNodeIds() != null && !accessCriteria.getTaskNodeIds().isEmpty()) {
            return canAccessTaskNodes(authority, userProfile, toUuids(accessCriteria.getTaskNodeIds()));
        }

        if (accessCriteria.getDocumentIds() != null && !accessCriteria.getDocumentIds().isEmpty()) {
            return canAccessDocuments(authority, userProfile, accessCriteria.getDocumentIds()
                    .stream()
                    .map(UUID::fromString)
                    .collect(Collectors.toSet())
            );
        }


        return false;
    }

    private static boolean canAccessProjects(String authority, UserProfile userProfile, Set<String> requestedProjectIds) {
        Set<String> authorizedProjectIds = userProfile
                .getOrganizations()
                .stream()
                .filter(org -> org.getAuthorities().contains(authority))
                .flatMap(org -> org.getProjects().stream())
                .filter(project -> requestedProjectIds.contains(project.getId()))
                .map(proj -> proj.getId())
                .collect(Collectors.toSet());

        if (!authorizedProjectIds.containsAll(requestedProjectIds)) {
            return false;
        }

        return true;
    }

    private static boolean canAccessOrganizations(String authority, UserProfile userProfile, Set<String> requestedOrgIds) {
        Set<String> authorizedOrgIds = userProfile
                .getOrganizations()
                .stream()
                .filter(org -> requestedOrgIds.contains(org.getId()))
                .filter(org -> org.getAuthorities().contains(authority))
                .map(OrganizationUserDTO::getId)
                .collect(Collectors.toSet());

        if (!authorizedOrgIds.containsAll(requestedOrgIds)) {
            return false;
        }

        return true;
    }

    private boolean canAccessThread(String authority, UserProfile userProfile, UUID threadId) {

        List<UUID> authorizedProjectIds = userProfile
                .getOrganizations()
                .stream()
                .filter(org -> org.getAuthorities().contains(authority))
                .flatMap(org -> org.getProjects().stream())
                .map(project -> UUID.fromString(project.getId()))
                .collect(Collectors.toList());

        return chatThreadRepository.existsByIdAndProjectIdIn(threadId, authorizedProjectIds);
    }

    private boolean canAccessDocument(String authority, UserProfile userProfile, UUID documentId) {

        List<UUID> authorizedProjectIds = userProfile
                .getOrganizations()
                .stream()
                .filter(org -> org.getAuthorities().contains(authority))
                .flatMap(org -> org.getProjects().stream())
                .map(project -> UUID.fromString(project.getId()))
                .collect(Collectors.toList());

        return documentInstanceRepository.existsByDocumentIdAndProjectIds(documentId, authorizedProjectIds);
    }

    /** A task is accessible when it belongs to a project the user has the authority in. */
    private boolean canAccessTask(String authority, UserProfile userProfile, UUID taskId) {
        return taskRepository.existsByIdAndProjectIdIn(taskId, authorizedProjectIds(authority, userProfile));
    }

    private boolean canAccessTaskNodes(String authority, UserProfile userProfile, Collection<UUID> taskNodeIds) {
        return areAllNodesInAnyProject(taskNodeIds, authorizedProjectIds(authority, userProfile));
    }

    /**
     * True if every task node belongs to a task of one of the given projects. One query, so it can
     * also be used for the node ids that arrive in a request body and are checked in the controller.
     */
    public boolean areAllNodesInAnyProject(Collection<UUID> taskNodeIds, Collection<UUID> projectIds) {
        // distinct ids are required: the query compares COUNT(DISTINCT id) with the array size
        UUID[] nodeIdArray = taskNodeIds.stream().filter(Objects::nonNull).distinct().toArray(UUID[]::new);
        return nodeIdArray.length > 0
                && taskNodeRepository.areAllNodeIdsInAnyProject(nodeIdArray, projectIds.toArray(UUID[]::new));
    }

    private Set<UUID> authorizedProjectIds(String authority, UserProfile userProfile) {
        return userProfile
                .getOrganizations()
                .stream()
                .filter(org -> org.getAuthorities().contains(authority))
                .flatMap(org -> org.getProjects().stream())
                .map(project -> UUID.fromString(project.getId()))
                .collect(Collectors.toSet());
    }

    private boolean canAccessDocuments(String authority, UserProfile userProfile, Set<UUID> documentIds) {

        Set<UUID> authorizedProjectIds = userProfile
                .getOrganizations()
                .stream()
                .filter(org -> org.getAuthorities().contains(authority))
                .flatMap(org -> org.getProjects().stream())
                .map(project -> UUID.fromString(project.getId()))
                .collect(Collectors.toSet());

        boolean areAllInProjectDocuments = documentInstanceRepository.areAllDocumentIdsInAnyProject(
                documentIds.toArray(UUID[]::new),
                authorizedProjectIds.toArray(UUID[]::new));
        if (areAllInProjectDocuments) {
            return true;
        }

        boolean areAllInChatDocuments = chatThreadDocumentsRepository.areAllDocumentIdsInAnyProject(documentIds.toArray(UUID[]::new),
                authorizedProjectIds.toArray(UUID[]::new));

        if (areAllInChatDocuments) {
            return true;
        }
        // missing the case that some are in project documents and some in chat documents,
        // but it is not intended to be used like that, for now :)
        // if needed, it can be done with one query in the future

        return false;

    }


    private AccessCriteria getRequestedOrgsFromRequestParams() {
        HttpServletRequest request = getCurrentHttpRequest();
        //get request param with name "organizationId"
        String organizationId = request.getParameter(QueryParamNames.ORGANIZATION_ID);
        String[] orgStrings = request.getParameterValues(QueryParamNames.ORGANIZATION_ID_IN);


        if (organizationId == null && orgStrings == null) {
            return new AccessCriteria();
        }

        Set<String> requestedOrgIds = new HashSet<>();

        if (orgStrings != null) {
            requestedOrgIds.addAll(Set.of(orgStrings));
        }
        if (organizationId != null) {
            requestedOrgIds.add(organizationId);
        }
        return AccessCriteria.builder()
                .orgIds(requestedOrgIds)
                .projectIds(new HashSet<>())
                .threadId(new String())
                .build();
    }


    @Nullable
    private AccessCriteria getRequestedOrgIdFromPathVariable() {
        // Extract organizationId from the request path
        HttpServletRequest request = getCurrentHttpRequest();
        Map<String, String> uriTemplateVariables = (Map<String, String>) request.getAttribute(HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE);

        String organizationId = new String();

        if (uriTemplateVariables != null) {
            organizationId = uriTemplateVariables.get(QueryParamNames.ORGANIZATION_ID);
        }
        Set<String> requestedOrgIds = new HashSet<>();

        if (organizationId != null) {
            requestedOrgIds.add(organizationId);
        }

        return AccessCriteria
                .builder()
                .orgIds(requestedOrgIds)
                .projectIds(new HashSet<>())
                .threadId(new String())
                .build();
    }


    private AccessCriteria getRequestedProjectsFromRequestParams() {
        HttpServletRequest request = getCurrentHttpRequest();
        //get request param with name "projectId"
        String projectId = request.getParameter(QueryParamNames.PROJECT_ID);
        String[] projectStrings = request.getParameterValues(QueryParamNames.PROJECT_ID_IN);
        // 'splitProjectStrings' now contains individual elements, split by commas
        // You can now use 'splitProjectStrings' as required
        if (projectStrings != null) {
            projectStrings = Arrays.stream(projectStrings)
                    .flatMap(s -> Arrays.stream(s.split(",")))
                    .toArray(String[]::new);


        }

        if (projectId == null && projectStrings == null) {
            return new AccessCriteria();
        }

        Set<String> requestedProjectIds = new HashSet<>();
        if (projectStrings != null) {
            requestedProjectIds.addAll(Set.of(projectStrings));
        }
        if (projectId != null) {
            requestedProjectIds.add(projectId);
        }
        return AccessCriteria
                .builder()
                .orgIds(new HashSet<>())
                .projectIds(requestedProjectIds)
                .threadId(new String())
                .build();
    }

    @Nullable
    private AccessCriteria getRequestedProjectIdFromPathVariable() {
        // Extract organizationId from the request path
        HttpServletRequest request = getCurrentHttpRequest();
        Map<String, String> uriTemplateVariables = (Map<String, String>) request.getAttribute(HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE);

        String projectId = new String();
        if (uriTemplateVariables != null) {
            projectId = uriTemplateVariables.get(QueryParamNames.PROJECT_ID);
        }
        Set<String> requestedProjectIds = new HashSet<>();

        if (projectId != null) {
            requestedProjectIds.add(projectId);
        }

        return AccessCriteria
                .builder()
                .orgIds(new HashSet<>())
                .projectIds(requestedProjectIds)
                .threadId(new String())
                .build();
    }

    private AccessCriteria getRequestedThreadIdFromPathVariable() {
        // Extract threadId from the request path
        HttpServletRequest request = getCurrentHttpRequest();
        Map<String, String> uriTemplateVariables = (Map<String, String>) request.getAttribute(HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE);

        String threadId = new String();

        if (uriTemplateVariables != null) {
            threadId = uriTemplateVariables.get(QueryParamNames.THREAD_ID);
        }

        return AccessCriteria
                .builder()
                .orgIds(new HashSet<>())
                .projectIds(new HashSet<>())
                .threadId(threadId)
                .documentIds(List.of())
                .build();
    }

    private AccessCriteria getRequestedDocumentIdFromPathVariable() {
        // Extract documentId from the request path
        HttpServletRequest request = getCurrentHttpRequest();
        Map<String, String> uriTemplateVariables = (Map<String, String>) request.getAttribute(HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE);

        String documentId = new String();

        if (uriTemplateVariables != null) {
            documentId = uriTemplateVariables.get(QueryParamNames.DOCUMENT_INSTANCE_ID);
        }


        return getRequestedDocumentIdAccessCriteria(documentId);
    }

    /** The {taskId} of the path, so a task of another project can't be reached through it. */
    private AccessCriteria getRequestedTaskIdFromPathVariable() {
        AccessCriteria accessCriteria = new AccessCriteria();
        accessCriteria.setTaskId(getUriTemplateVariable(QueryParamNames.TASK_ID));

        return accessCriteria;
    }

    /** The ?id= of a task node, for the endpoints that address a node directly. */
    private AccessCriteria getRequestedTaskNodeIdFromRequestParam() {
        AccessCriteria accessCriteria = new AccessCriteria();
        String taskNodeId = getCurrentHttpRequest().getParameter(QueryParamNames.TASK_NODE_ID);
        accessCriteria.setTaskNodeIds(taskNodeId == null ? List.of() : List.of(taskNodeId));

        return accessCriteria;
    }

    private String getUriTemplateVariable(String name) {
        Map<String, String> uriTemplateVariables =
                (Map<String, String>) getCurrentHttpRequest().getAttribute(HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE);

        return uriTemplateVariables == null ? null : uriTemplateVariables.get(name);
    }

    private AccessCriteria getRequestedDocumentIdsFromRequestParam() {
        HttpServletRequest request = getCurrentHttpRequest();

        // for: ?documentIds=uuid1&documentIds=uuid2
        String[] values = request.getParameterValues("documentIds");

        List<String> documentIds = Collections.emptyList();
        if (values != null && values.length > 0) {
            documentIds = Arrays.stream(values)
                    .toList();
        }

        return getRequestedDocumentIdsAccessCriteria(documentIds);
    }

    public boolean requestedDocumentsBelongToRequestedProject() {
        Set<String> projectIds = getRequestedProjectIdFromPathVariable().getProjectIds();
        Set<String> documentIds = new HashSet<>(getRequestedDocumentIdsFromRequestParam().getDocumentIds());
        documentIds.addAll(getRequestedDocumentIdFromPathVariable().getDocumentIds());
        documentIds.removeIf(id -> id == null || id.isBlank());

        return projectIds.size() == 1
                && !documentIds.isEmpty()
                && areAllDocumentsInAnyProject(toUuids(documentIds), toUuids(projectIds));
    }

    /**
     * True if every document is a project document or a chat attachment of one of the given projects.
     */
    public boolean areAllDocumentsInAnyProject(Collection<UUID> documentIds, Collection<UUID> projectIds) {
        // distinct ids are required: the queries compare COUNT(DISTINCT document_id) with the array size
        UUID[] documentIdArray = documentIds.stream().filter(Objects::nonNull).distinct().toArray(UUID[]::new);
        UUID[] projectIdArray = projectIds.toArray(UUID[]::new);
        return documentInstanceRepository.areAllDocumentIdsInAnyProject(documentIdArray, projectIdArray)
                || chatThreadDocumentsRepository.areAllDocumentIdsInAnyProject(documentIdArray, projectIdArray);
    }


    private static List<UUID> toUuids(Collection<String> ids) {
        return ids.stream().map(UUID::fromString).toList();
    }

    public AccessCriteria getRequestedDocumentIdAccessCriteria(String documentId) {

        String documentIdParam = Objects.toString(documentId, "");

        return AccessCriteria.builder()
                .orgIds(Collections.emptySet())
                .projectIds(Collections.emptySet())
                .threadId("")
                .documentIds(List.of(documentIdParam))
                .build();
    }

    public AccessCriteria getRequestedDocumentIdsAccessCriteria(List<String> documentIds) {

        List<String> documentIdsParam = documentIds.stream()
                .map(dId -> Objects.toString(dId, ""))
                .collect(Collectors.toList());

        return AccessCriteria.builder()
                .orgIds(Collections.emptySet())
                .projectIds(Collections.emptySet())
                .threadId("")
                .documentIds(documentIdsParam)
                .build();
    }

    public boolean isPublicProject(String projectId) {
//        ProjectAgent projectAgent = projectAgentService.getAgentByProjectId(UUID.fromString(projectId));
//        return Boolean.FALSE.equals(projectAgent.getPrivateAgent());
        return projectAgentService.isPublicAgent(UUID.fromString(projectId));
    }

    public boolean isPublicThread(UUID threadId) {

        return chatThreadRepository.existsByIdAndPublicThreadIsTrue(threadId);
    }

    public boolean threadHasDocumentInMessageLocalContext(UUID threadId, UUID documentId) {
        if (threadId == null || documentId == null) return false;

        return messageLocalContextService
                .isDocumentAttachedToThread(threadId, documentId);
    }

    /**
     * Returns true if the currently authenticated user is the one who uploaded the document.
     * Used to allow preview of just-uploaded attachments before they are added to a message local context.
     */
    public boolean isDocumentCreatedByCurrentUser(UUID documentId) {
        if (documentId == null) return false;
        try {
            UUID currentUserId = getUserId();
            if (currentUserId == null) return false;
            return documentInstanceRepository.existsByIdAndCreatedBy(documentId, currentUserId);
        } catch (Exception e) {
            return false;
        }
    }

    private AccessCriteria getRequestedOrgIdFromDocumentIdPathVariable() {
        HttpServletRequest request = getCurrentHttpRequest();
        Map<String, String> uriTemplateVariables = (Map<String, String>) request.getAttribute(HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE);

        String documentIdStr = null;
        if (uriTemplateVariables != null) {
            documentIdStr = uriTemplateVariables.get(QueryParamNames.DOCUMENT_INSTANCE_ID);
        }

        if (documentIdStr == null || documentIdStr.isBlank()) {
            return new AccessCriteria();
        }

        UUID documentId;
        try {
            documentId = UUID.fromString(documentIdStr);
        } catch (Exception e) {
            return new AccessCriteria();
        }


        UUID orgId = documentInstanceRepository.findOrganizationIdByDocumentId(documentId);
        if (orgId == null) {
            return new AccessCriteria();
        }

        return AccessCriteria.builder()
                .orgIds(Set.of(orgId.toString()))
                .projectIds(Collections.emptySet())
                .threadId("")
                .documentIds(Collections.emptyList())
                .build();
    }


    public class AccessCriteriaGetterFunction {

        public static final String ORG_IDS_FROM_REQUEST_PARAMS = "getRequestedOrgsFromRequestParams";
        public static final String ORG_ID_FROM_PATH_VARIABLE = "getRequestedOrgIdFromPathVariable";

        public static final String PROJECT_IDS_FROM_REQUEST_PARAMS = "getRequestedProjectsFromRequestParams";
        public static final String PROJECT_ID_FROM_PATH_VARIABLE = "getRequestedProjectIdFromPathVariable";

        public static final String THREAD_ID_FROM_PATH_VARIABLE = "getRequestedThreadIdFromPathVariable";
        public static final String DOCUMENT_ID_FROM_PATH_VARIABLE = "getRequestedDocumentIdFromPathVariable";
        public static final String DOCUMENT_IDS_FROM_REQUEST_PARAMS = "getRequestedDocumentIdsFromRequestParams";
        public static final String ORG_ID_FROM_DOCUMENT_ID_PATH_VARIABLE = "getRequestedOrgIdFromDocumentIdPathVariable";

        public static final String TASK_ID_FROM_PATH_VARIABLE = "getRequestedTaskIdFromPathVariable";
        public static final String TASK_NODE_ID_FROM_REQUEST_PARAM = "getRequestedTaskNodeIdFromRequestParam";
    }


    /**
     * This is a general method to check for Authorization
     *
     * @param authority      the authority that the user should have
     * @param getterFunction this is used to find the appropriate function, that will extract the {@link AccessCriteria}
     *                       from path variables or requestparams or JSON body
     * @return
     */
    public boolean hasAuthority(String authority, String getterFunction) throws IOException {

        AccessCriteria accessCriteria = new AccessCriteria();


        if (AccessCriteriaGetterFunction.ORG_IDS_FROM_REQUEST_PARAMS.equals(getterFunction)) {
            accessCriteria = getRequestedOrgsFromRequestParams();
        }
        if (AccessCriteriaGetterFunction.ORG_ID_FROM_PATH_VARIABLE.equals(getterFunction)) {
            accessCriteria = getRequestedOrgIdFromPathVariable();
        }


        if (AccessCriteriaGetterFunction.PROJECT_IDS_FROM_REQUEST_PARAMS.equals(getterFunction)) {
            accessCriteria = getRequestedProjectsFromRequestParams();
        }
        if (AccessCriteriaGetterFunction.PROJECT_ID_FROM_PATH_VARIABLE.equals(getterFunction)) {
            accessCriteria = getRequestedProjectIdFromPathVariable();
        }

        if (AccessCriteriaGetterFunction.THREAD_ID_FROM_PATH_VARIABLE.equals(getterFunction)) {
            accessCriteria = getRequestedThreadIdFromPathVariable();
        }

        if (AccessCriteriaGetterFunction.DOCUMENT_ID_FROM_PATH_VARIABLE.equals(getterFunction)) {
            accessCriteria = getRequestedDocumentIdFromPathVariable();
        }

        if (AccessCriteriaGetterFunction.DOCUMENT_IDS_FROM_REQUEST_PARAMS.equals(getterFunction)) {
            accessCriteria = getRequestedDocumentIdsFromRequestParam();
        }

        if (AccessCriteriaGetterFunction.ORG_ID_FROM_DOCUMENT_ID_PATH_VARIABLE.equals(getterFunction)) {
            accessCriteria = getRequestedOrgIdFromDocumentIdPathVariable();
        }

        if (AccessCriteriaGetterFunction.TASK_ID_FROM_PATH_VARIABLE.equals(getterFunction)) {
            accessCriteria = getRequestedTaskIdFromPathVariable();
        }

        if (AccessCriteriaGetterFunction.TASK_NODE_ID_FROM_REQUEST_PARAM.equals(getterFunction)) {
            accessCriteria = getRequestedTaskNodeIdFromRequestParam();
        }

        if (!(SecurityContextHolder.getContext().getAuthentication().getPrincipal() instanceof UserProfile)) {
            return false;
        }
        UserProfile userProfile = (UserProfile) SecurityContextHolder.getContext().getAuthentication().getPrincipal();


        return this.hasAuthority(userProfile, authority, accessCriteria);
    }


    /**
     * Use to check for Authorization with provided AccessCriteria, this is used inside services
     * the other #hasAuthority is used in @PreAuthorize annotations.
     * <p>
     * To generate the AccessCriteria, you can use the related getter methods in this class.
     * *
     *
     * @param userProfile
     * @param authority
     * @param accessCriteria
     * @return
     * @throws IOException
     */
    public boolean hasAuthority(UserProfile userProfile, String authority, AccessCriteria accessCriteria) {

        if (isSuperAdmin(userProfile)) {
            return true; // Skip validation if user is an admin
        }

        if (accessCriteria == null) {
            return false;
        }
        return can(authority, userProfile, accessCriteria);
    }


    public UUID getUserId() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String userId = ((UserProfile) authentication.getPrincipal()).getId();
            return UUID.fromString(userId);
        } catch (Exception e) {
            logger.trace("An exception occurred while trying to get the user ID: " + e.getMessage());
            return null;
        }
    }

    public String getUserIdentifier() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String email = ((UserProfile) authentication.getPrincipal()).getEmail();
            if (email != null) {
                return email;
            }
            return ((UserProfile) authentication.getPrincipal()).getUserName();
        } catch (Exception e) {
            logger.trace("An exception occurred while trying to get the user ID: " + e.getMessage());
            return null;
        }
    }

    private HttpServletRequest getCurrentHttpRequest() {
        RequestAttributes requestAttributes = RequestContextHolder.getRequestAttributes();
        if (requestAttributes instanceof ServletRequestAttributes) {
            return ((ServletRequestAttributes) requestAttributes).getRequest();
        }

        return null;
    }


    public static String calculateSHA256(String text) throws GendoxException {
        try {
            // Get an instance of SHA-256 MessageDigest
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            // Calculate the hash
            byte[] hashBytes = digest.digest(text.getBytes());
            // Encode the hash in Base32
            Base32 base32 = new Base32();
            return base32.encodeToString(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new GendoxException("HASHING_ERROR", "An error occurred while hashing the text", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}