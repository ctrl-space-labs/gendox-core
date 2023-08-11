package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import dev.ctrlspace.gendox.gendoxcoreapi.model.User;
import dev.ctrlspace.gendox.gendoxcoreapi.model.UserOrganization;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.JwtDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.OrganizationUserDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.UserProfile;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.ProjectCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.RolePermissionCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.UserOrganizationCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ProjectService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.RolePermissionService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.UserOrganizationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

@Component
public class UserProfileConverter {

    @Autowired
    private UserOrganizationService userOrganizationService;

    @Autowired
    private OrganizationUserConverter organizationUserConverter;

    @Autowired
    private ProjectService projectService;

    @Autowired
    private RolePermissionService rolePermissionService;

    public UserProfile toDTO(User user) throws GendoxException {
        // TODO Complete this
        List<UserOrganization> userOrganizations = userOrganizationService.getAll(UserOrganizationCriteria
                .builder()
                .userId(user.getId().toString())
                .build());
        List<Long> roleIds = userOrganizations.stream()
                .map(userOrganization -> userOrganization.getRole().getId())
                .distinct()
                .collect(Collectors.toList());


        Map<String, List<String>> rolePermissionMap = rolePermissionService.getRoleToPermissionMapping(RolePermissionCriteria
                .builder()
                .roleIdIn(roleIds)
                .build());


        Map<String, JwtDTO.OrganizationAuthorities> organizationAuthoritiesMap = getOrganizationAuthoritiesMapping(userOrganizations, rolePermissionMap);


        List<OrganizationUserDTO> organizationUserDTOS = userOrganizations.stream()
                .map(userOrganization -> userOrganization.getOrganization())
                .map(organization -> {
                    // TODO obtimize this to get all projects per Organization in one query
                    Page<Project> projects = new PageImpl<>(new ArrayList<>());
                    try {
                        projects = projectService.getAll(ProjectCriteria
                                        .builder()
                                        .userId(user.getId().toString())
                                        .organizationId(organization.getId().toString())
                                        .build(),
                                Pageable.unpaged());
                    } catch (GendoxException e) {
                        throw new RuntimeException(e);
                    }

                    return organizationUserConverter.toDTO(organization,
                            organizationAuthoritiesMap.get(organization.getId().toString()).orgAuthorities(),
                            projects.getContent());
                })
                .collect(Collectors.toList());

//        QOrganization organization = QOrganization.organization;
        return UserProfile.builder()
                .id(user.getId().toString())
                .email(user.getEmail())
                .globalRoleName(user.getGlobalRole().getName())
                .name(user.getName())
                .organizations(organizationUserDTOS)
                .build();
    }

    /**
     * Get organization authorities mapping for given user organizations
     * eg: {
     * UUID1: {
     * organizationId: UUID1,
     * authorities: [ROLE_ADMIN, READ, WRITE, DELETE]
     * },
     * UUID2: {
     * organizationId: UUID2,
     * authorities: [ROLE_READER, READ]
     * }
     * }
     *
     * @param userOrganizations
     * @param rolePermissionMap
     * @return
     */
    private static Map<String, JwtDTO.OrganizationAuthorities> getOrganizationAuthoritiesMapping(List<UserOrganization> userOrganizations, Map<String, List<String>> rolePermissionMap) {
        Map<String, JwtDTO.OrganizationAuthorities> organizationAuthoritiesMap = new HashMap<>();
        //User role in each organization
        for (UserOrganization userOrganization : userOrganizations) {
            JwtDTO.OrganizationAuthorities organizationAuthorities = organizationAuthoritiesMap.getOrDefault(userOrganization.getOrganization().getId().toString(), new JwtDTO.OrganizationAuthorities(new HashSet<>()));
            String roleName = userOrganization.getRole().getName();
            organizationAuthorities.orgAuthorities().add(roleName);
            organizationAuthoritiesMap.put(userOrganization.getOrganization().getId().toString(), organizationAuthorities);
            //Add role permissions
            if (rolePermissionMap.containsKey(roleName)) {
                organizationAuthorities.orgAuthorities().addAll(rolePermissionMap.get(roleName));
            }
        }
        return organizationAuthoritiesMap;
    }
}
