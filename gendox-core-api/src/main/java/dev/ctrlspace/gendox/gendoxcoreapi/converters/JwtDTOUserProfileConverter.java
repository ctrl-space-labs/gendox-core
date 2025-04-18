package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.JwtDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.UserProfile;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class JwtDTOUserProfileConverter {

    public JwtDTO jwtDTO(UserProfile userProfile) {

        Map<String, JwtDTO.OrganizationAuthorities> organizationAuthoritiesMap = convertOrganizationAuthoritiesToMap(userProfile);

        Map<String, JwtDTO.OrganizationProject> organizationProjectMap = convertOrganizationProjectToMap(userProfile);

        Map<String, JwtDTO.ProjectAgent> projectAgentMap = convertProjectAgentToMap(userProfile);

        Instant now = Instant.now();

        JwtDTO jwtDTO = JwtDTO.builder()
                .iss("https://auth.gendox.com/")
                .sub(userProfile.getId().toString())
                .aud(List.of("https://auth.gendox.com/", "https://api.gendox.com/", "https://app.gendox.com/"))
                .exp(now.plusSeconds(36000))
                .nbf(now)
                .iat(now)
                .jti(UUID.randomUUID().toString())
                .userId(userProfile.getId())
                .email(userProfile.getEmail())
                .userName(userProfile.getUserName())
                .globalRole(userProfile.getGlobalUserRoleType().getName())
                .orgAuthoritiesMap(organizationAuthoritiesMap)
                .orgProjectsMap(organizationProjectMap)
                .projectAgentsMap(projectAgentMap)
                .build();
        return jwtDTO;
    }

    private static Map<String, JwtDTO.OrganizationAuthorities> convertOrganizationAuthoritiesToMap(UserProfile userProfile) {
        //convert userProfile organizations to map of authorities
        Map<String, JwtDTO.OrganizationAuthorities> organizationAuthoritiesMap = userProfile.getOrganizations().stream()
                .collect(Collectors.toMap(
                        organization -> organization.getId().toString(),
                        organization -> new JwtDTO.OrganizationAuthorities(organization.getAuthorities())
                ));
        return organizationAuthoritiesMap;
    }

    private static Map<String, JwtDTO.OrganizationProject> convertOrganizationProjectToMap(UserProfile userProfile) {
        //convert user profile organization projects to map of projects
        Map<String, JwtDTO.OrganizationProject> organizationProjectMap = userProfile.getOrganizations().stream()
                .collect(Collectors.toMap(
                        organization -> organization.getId().toString(),
                        organization -> new JwtDTO.OrganizationProject(organization.getProjects().stream()
                                .map(project -> project.getId().toString())
                                .collect(Collectors.toSet()))


                ));
        return organizationProjectMap;
    }

    private static Map<String, JwtDTO.ProjectAgent> convertProjectAgentToMap(UserProfile userProfile) {
        //convert user profile organization projects to map of projects
        Map<String, JwtDTO.ProjectAgent> projectAgentMap = userProfile.getOrganizations().stream()
                .collect(Collectors.toMap(
                        organization -> organization.getId().toString(),
                        organization -> new JwtDTO.ProjectAgent(organization.getProjectAgents().stream()
                                .map(projectAgent -> projectAgent.getId().toString())
                                .collect(Collectors.toSet()))


                ));
        return projectAgentMap;
    }
}
