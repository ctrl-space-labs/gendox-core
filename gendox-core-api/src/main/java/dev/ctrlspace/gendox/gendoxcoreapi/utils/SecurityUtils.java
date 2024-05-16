package dev.ctrlspace.gendox.gendoxcoreapi.utils;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.ctrlspace.gendox.authentication.GendoxAuthenticationToken;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.OrganizationUserDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.UserProfile;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.AccessCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.QueryParamNames;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.UserNamesConstants;
import jakarta.servlet.http.HttpServletRequest;
import org.jetbrains.annotations.Nullable;
import org.slf4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.servlet.HandlerMapping;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Component("securityUtils")
public class SecurityUtils {

    Logger logger = org.slf4j.LoggerFactory.getLogger(SecurityUtils.class);

    @Autowired
    private JWTUtils jwtUtils;

    @Autowired
    private ObjectMapper objectMapper;

    public boolean isSuperAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return isSuperAdmin(authentication);

    }

    public boolean isSuperAdmin(Authentication authentication) {
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(grantedAuthority -> grantedAuthority.getAuthority().startsWith(UserNamesConstants.GENDOX_SUPER_ADMIN));
    }

    public boolean isUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(grantedAuthority -> {
                    String authority = grantedAuthority.getAuthority();
                    return authority.endsWith("_USER");
                });
    }

    public boolean isAgent(Authentication authentication) {
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(grantedAuthority -> grantedAuthority.getAuthority().startsWith(UserNamesConstants.GENDOX_AGENT));
    }


    public boolean can(String authority, GendoxAuthenticationToken authentication, AccessCriteria accessCriteria) {

        // Check if projectIds is not null and not empty, then check project access
        if (accessCriteria.getProjectIds() != null && !accessCriteria.getProjectIds().isEmpty()) {
            return canAccessProjects(authority, authentication, accessCriteria.getProjectIds());
        }

        // Check if orgIds is not null and not empty, then check organization access
        if (accessCriteria.getOrgIds() != null && !accessCriteria.getOrgIds().isEmpty()) {
            return canAccessOrganizations(authority, authentication, accessCriteria.getOrgIds());
        }


        return false;
    }

    private static boolean canAccessProjects(String authority, GendoxAuthenticationToken authentication, Set<String> requestedProjectIds) {
        Set<String> authorizedProjectIds = authentication
                .getPrincipal()
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

    private static boolean canAccessOrganizations(String authority, GendoxAuthenticationToken authentication, Set<String> requestedOrgIds) {
        Set<String> authorizedOrgIds = authentication
                .getPrincipal()
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
                .build();
    }


    public class AccessCriteriaGetterFunction {

        public static final String ORG_IDS_FROM_REQUEST_PARAMS = "getRequestedOrgsFromRequestParams";
        public static final String ORG_ID_FROM_PATH_VARIABLE = "getRequestedOrgIdFromPathVariable";

        public static final String PROJECT_IDS_FROM_REQUEST_PARAMS = "getRequestedProjectsFromRequestParams";
        public static final String PROJECT_ID_FROM_PATH_VARIABLE = "getRequestedProjectIdFromPathVariable";

    }


    /**
     * This is a general method to check for Authorization
     *
     * @param authority      the authority that the user should have
     * @param getterFunction this is used to find the appropriate function, that will extract the {@link AccessCriteria}
     *                       from path variables or requstparams or JSON body
     * @return
     */
    public boolean hasAuthority(String authority, String getterFunction) throws IOException {
        GendoxAuthenticationToken authentication = (GendoxAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();

        if (isSuperAdmin(authentication)) {
            return true; // Skip validation if user is an admin
        }

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

        if (accessCriteria == null) {
            return false;
        }
        return can(authority, authentication, accessCriteria);
    }


    public UUID getUserId() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String userId = ((UserProfile) authentication.getPrincipal()).getId();
            return UUID.fromString(userId);
        } catch (Exception e) {
            logger.warn("An exception occurred while trying to get the user ID: " + e.getMessage());
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
        } catch (Exception e){
            logger.warn("An exception occurred while trying to get the user ID: " + e.getMessage());
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
}