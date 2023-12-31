package dev.ctrlspace.gendox.gendoxcoreapi.utils;

import dev.ctrlspace.gendox.gendoxcoreapi.discord.utils.CommonCommandUtility;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.JwtDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.UserProfile;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.QueryParamNames;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.UserNamesConstants;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.UUID;

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


    public boolean hasAuthorityToRequestedOrgId(String authority) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        //JwtDTO jwtDTO = jwtUtils.toJwtDTO((Jwt)authentication.getPrincipal());
        if (isSuperAdmin(authentication)) {
            return true; // Skip validation if user is an admin
        }

//        authentication.ge
        HttpServletRequest request = getCurrentHttpRequest();
        //get request param with name "organizationId"
        String organizationId = request.getParameter(QueryParamNames.ORGANIZATION_ID);

        if (organizationId == null) {
            return false;
        }

//        if (!jwtDTO.getOrgAuthoritiesMap().containsKey(organizationId)) {
//            return false;
//        }

//
//        if (!jwtDTO.getOrgAuthoritiesMap().get(organizationId).orgAuthorities().contains(authority)){
//            return false;
//        }

        return true;
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