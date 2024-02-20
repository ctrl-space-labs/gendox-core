package dev.ctrlspace.gendox.gendoxcoreapi.utils;

import dev.ctrlspace.gendox.authentication.GendoxAuthenticationToken;
import dev.ctrlspace.gendox.gendoxcoreapi.discord.utils.CommonCommandUtility;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.JwtDTO;
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
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.servlet.HandlerMapping;

import java.util.*;
import java.util.stream.Collectors;

@Component("securityUtils")
public class SecurityUtils {

    Logger logger = org.slf4j.LoggerFactory.getLogger(SecurityUtils.class);

    @Autowired
    private JWTUtils jwtUtils;

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



    private static boolean can(String authority, GendoxAuthenticationToken authentication, AccessCriteria accessCriteria) {

        if (! accessCriteria.getOrgIds().isEmpty()) {
            return canAccessOrganizations(authority, authentication, accessCriteria.getOrgIds());
        }

        if (! accessCriteria.getProjectIds().isEmpty()) {
            return canAccessProjects(authority, authentication, accessCriteria.getProjectIds());

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


    // TODO delete this, use `hasAuthority` instead
//    public boolean hasAuthorityToRequestedOrgId(String authority) {
//        GendoxAuthenticationToken authentication = (GendoxAuthenticationToken)SecurityContextHolder.getContext().getAuthentication();
//        //JwtDTO jwtDTO = jwtUtils.toJwtDTO((Jwt)authentication.getPrincipal());
//        if (isSuperAdmin(authentication)) {
//            return true; // Skip validation if user is an admin
//        }
//
////        authentication.ge
//        AccessCriteria accessCriteria = getRequestedOrgsFromRequestParams();
//
//        if (accessCriteria.getOrgIds().isEmpty()) return false;
//
//        return can(authority, authentication, accessCriteria);
//
//    }

    private AccessCriteria getRequestedOrgsFromRequestParams() {
        HttpServletRequest request = getCurrentHttpRequest();
        //get request param with name "organizationId"
        String organizationId = request.getParameter(QueryParamNames.ORGANIZATION_ID);
        String[] orgStrings= request.getParameterValues(QueryParamNames.ORGANIZATION_ID_IN);


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
        return AccessCriteria.builder().orgIds(requestedOrgIds).build();
    }


    // TODO delete this, use `hasAuthority` instead
//    public boolean hasAuthorityToUpdateOrgId(String authority) {
//        GendoxAuthenticationToken authentication = (GendoxAuthenticationToken)SecurityContextHolder.getContext().getAuthentication();
//
//        if (isSuperAdmin(authentication)) {
//            return true; // Skip validation if user is an admin
//        }
//
//        AccessCriteria accessCriteria = getRequestedOrgIdFromPathVariable();
//
//        // If organizationId is still null, return false
//        if (accessCriteria == null) {
//            return false;
//        }
//
//        return can(authority, authentication, accessCriteria);
//
//    }

    @Nullable
    private AccessCriteria getRequestedOrgIdFromPathVariable() {
        // Extract organizationId from the request path
        HttpServletRequest request = getCurrentHttpRequest();
        Map<String, String> uriTemplateVariables = (Map<String, String>) request.getAttribute(HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE);
        String organizationId = null;
        if (uriTemplateVariables != null) {
            organizationId = uriTemplateVariables.get("organizationId");
        }
        Set<String> requestedOrgIds = new HashSet<>();

        if (organizationId != null) {
            requestedOrgIds.add(organizationId);
        }

        return AccessCriteria
                .builder()
                .orgIds(requestedOrgIds)
                .build();
    }


    public class AccessCriteriaGetterFunction {

        public static final String ORG_IDS_FROM_REQUEST_PARAMS = "getRequestedOrgsFromRequestParams";
        public static final String ORG_ID_FROM_PATH_VARIABLE = "getRequestedOrgIdFromPathVariable";
    }


    /**
     * This is a general method to check for Authorization
     *
     * @param authority the authority that the user should have
     * @param getterFunction this is used to find the appropriate function, that will extract the {@link AccessCriteria}
     *                       from path variables or requstparams or ....
     * @return
     */
    public boolean hasAuthority(String authority, String getterFunction) {
        GendoxAuthenticationToken authentication = (GendoxAuthenticationToken)SecurityContextHolder.getContext().getAuthentication();

        if (isSuperAdmin(authentication)) {
            return true; // Skip validation if user is an admin
        }

        AccessCriteria accessCriteria = null;

        if (AccessCriteriaGetterFunction.ORG_IDS_FROM_REQUEST_PARAMS.equals(getterFunction)){
            accessCriteria = getRequestedOrgsFromRequestParams();
        }
        if (AccessCriteriaGetterFunction.ORG_ID_FROM_PATH_VARIABLE.equals(getterFunction)) {
            accessCriteria = getRequestedOrgIdFromPathVariable();
        }

        if (accessCriteria == null) {
            return false;
        }
        return can(authority, authentication, accessCriteria);
    }

    public boolean hasAuthorityToRequestedProjectId() {
        return hasAuthorityToRequestedProjectId(QueryParamNames.PROJECT_ID);
    }
    public boolean hasAuthorityToRequestedProjectId(String queryParamName) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        JwtDTO jwtDTO = jwtUtils.toJwtDTO((Jwt)authentication.getPrincipal());
        if (isSuperAdmin(authentication)) {
            return true; // Skip validation if user is an admin
        }
        HttpServletRequest request = getCurrentHttpRequest();
        //get request param with name "projectID"
        String projectId = request.getParameter(queryParamName);

        if (projectId == null) {
            return false;
        }

        if (jwtDTO.getOrgProjectsMap()
                .entrySet()
                .stream()
                .noneMatch(entry -> entry.getValue().projectIds().contains(projectId))) {
            return false;
        }

        return true;
    }


    /**
     * Property projectIdIn is a list of projectIds provided in a request param like:
     * projectIdIn=1,2,3,4,5
     * @return
     */
    public boolean hasAuthorityToAllRequestedProjectId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        JwtDTO jwtDTO = jwtUtils.toJwtDTO((Jwt)authentication.getPrincipal());
        if (isSuperAdmin(authentication)) {
            return true; // Skip validation if user is an admin
        }
        HttpServletRequest request = getCurrentHttpRequest();
        //get request param with name "projectID"
        String projectIdIn = request.getParameter(QueryParamNames.PROJECT_ID_IN);

        if (projectIdIn == null) {
            return false;
        }

        String[] projectIds = projectIdIn.split(",");

        if (projectIds.length == 0) {
            return false;
        }

        for (String projectId : projectIds) {
            if (jwtDTO.getOrgProjectsMap()
                    .entrySet()
                    .stream()
                    .noneMatch(entry -> entry.getValue().projectIds().contains(projectId))) {
                return false;
            }
        }

        return true;

    }

    public UUID getUserId() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String userId = ((UserProfile) authentication.getPrincipal()).getId();
            return UUID.fromString(userId);
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