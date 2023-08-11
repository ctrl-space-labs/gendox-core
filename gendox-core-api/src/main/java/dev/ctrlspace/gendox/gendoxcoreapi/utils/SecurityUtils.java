package dev.ctrlspace.gendox.gendoxcoreapi.utils;

import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.JwtDTO;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Component("securityUtils")
public class SecurityUtils {

    @Autowired
    private JWTUtils jwtUtils;

    public boolean isSuperAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return isSuperAdmin(authentication);

    }

    public boolean isSuperAdmin(Authentication authentication) {
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(grantedAuthority -> grantedAuthority.getAuthority().startsWith("ROLE_SUPER_ADMIN"));
    }

    public boolean isUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(grantedAuthority -> grantedAuthority.getAuthority().startsWith("ROLE_USER"));
    }


    public boolean hasAuthorityToRequestedOrgId(String authority) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        JwtDTO jwtDTO = jwtUtils.toJwtDTO((Jwt)authentication.getPrincipal());
        if (isSuperAdmin(authentication)) {
            return true; // Skip validation if user is an admin
        }



//        authentication.ge
        HttpServletRequest request = getCurrentHttpRequest();
        //get request param with name "organizationId"
        String organizationId = request.getParameter("organizationId");

        if (organizationId == null) {
            return false;
        }

        if (!jwtDTO.getOrgAuthoritiesMap().containsKey(organizationId)) {
            return false;
        }

        if (!jwtDTO.getOrgAuthoritiesMap().get(organizationId).orgAuthorities().contains(organizationId)){
            return false;
        }

        return true;
    }

//    hasAuthorityToRequestedProjectId
    public boolean hasAuthorityToRequestedProjectId(String authority) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        JwtDTO jwtDTO = jwtUtils.toJwtDTO((Jwt) authentication.getPrincipal());
        if (isSuperAdmin(authentication)) {
            return true; // Skip validation if user is an admin
        }
        HttpServletRequest request = getCurrentHttpRequest();
        //get request param with name "projectId"
        String projectId = request.getParameter("projectId");

        if (projectId == null) {
            return false;
        }

        return jwtDTO.getOrgProjectsMap()
                .entrySet()
                .stream()
                .anyMatch(entry -> entry.getValue().projectIds().contains(projectId));
    }

    private HttpServletRequest getCurrentHttpRequest() {
        RequestAttributes requestAttributes = RequestContextHolder.getRequestAttributes();
        if (requestAttributes instanceof ServletRequestAttributes) {
            return ((ServletRequestAttributes) requestAttributes).getRequest();
        }

        return null;
    }
}