package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectAgent;
import dev.ctrlspace.gendox.gendoxcoreapi.model.User;
import dev.ctrlspace.gendox.gendoxcoreapi.model.UserOrganization;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.ProjectAgentCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.ProjectCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.RolePermissionCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.UserOrganizationCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ProjectAgentService;
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

    @Autowired
    private ProjectAgentService projectAgentService;

    public UserProfile toDTO(List<UserOrganizationProjectAgentDTO> dtos) throws GendoxException {
        if (dtos == null || dtos.isEmpty()) {
            return null;
        }

        List<Long> roleIds = dtos.stream()
                .map(UserOrganizationProjectAgentDTO::getOrgRoleId)
                .distinct()
                .toList();
        Map<String, List<String>> rolePermissionMap = rolePermissionService.getRoleToPermissionMapping(RolePermissionCriteria
                .builder()
                .roleIdIn(roleIds)
                .build());

        // Extract user-related information
        UserOrganizationProjectAgentDTO firstDto = dtos.get(0);
        UserProfile.UserProfileBuilder userProfileBuilder = UserProfile.builder()
                .id(firstDto.getId())
                .email(firstDto.getEmail())
                .firstName(firstDto.getFirstName())
                .lastName(firstDto.getLastName())
                .userName(firstDto.getUserName())
                .phone(firstDto.getPhone())
                .userTypeId(firstDto.getUsersTypeId() != null ? firstDto.getUsersTypeId().toString() : null)
                .name(firstDto.getName());

        // Group by organization
        Map<String, List<UserOrganizationProjectAgentDTO>> orgGrouped = dtos.stream()
                .collect(Collectors.groupingBy(UserOrganizationProjectAgentDTO::getOrgId));

        List<OrganizationUserDTO> organizations = orgGrouped.entrySet().stream()
                .map(entry -> {
                    List<UserOrganizationProjectAgentDTO> orgDtos = entry.getValue();
                    UserOrganizationProjectAgentDTO firstOrgDto = orgDtos.get(0);


                    // Group by project, excluding null projectIds
                    Map<String, List<UserOrganizationProjectAgentDTO>> projectGrouped = orgDtos.stream()
                            .filter(dto -> dto.getProjectId() != null)
                            .collect(Collectors.groupingBy(UserOrganizationProjectAgentDTO::getProjectId));

                    List<ProjectOrganizationDTO> projects = projectGrouped.entrySet().stream()
                            .map(projectEntry -> {
                                List<UserOrganizationProjectAgentDTO> projectDtos = projectEntry.getValue();
                                UserOrganizationProjectAgentDTO firstProjectDto = projectDtos.get(0);

                                return ProjectOrganizationDTO.builder()
                                        .id(firstProjectDto.getProjectId())
                                        .name(firstProjectDto.getProjectName())
                                        .description(firstProjectDto.getProjectDescription())
                                        .createdAt(firstProjectDto.getProjectCreatedAt())
                                        .updatedAt(firstProjectDto.getProjectUpdatedAt())
                                        .build();
                            }).collect(Collectors.toList());

                    // Collect agents, excluding null agentIds
                    List<ProjectAgentDTO> agents = orgDtos.stream()
                            .filter(dto -> dto.getAgentId() != null)
                            .map(dto -> ProjectAgentDTO.builder()
                                    .id(UUID.fromString(dto.getAgentId()))
                                    .userId(dto.getAgentUserId() != null ? UUID.fromString(dto.getAgentUserId()) : null)
                                    .agentName(dto.getAgentName())
                                    .projectId(dto.getProjectId() != null ? UUID.fromString(dto.getProjectId()) : null)
                                    .createdAt(dto.getAgentCreatedAt())
                                    .updatedAt(dto.getAgentUpdatedAt())
                                    .build())
                            .collect(Collectors.toList());

                    Set<String> authorities = new HashSet<>();
                    authorities.add(firstOrgDto.getOrgRoleName());
                    if (rolePermissionMap.containsKey(firstOrgDto.getOrgRoleName())) {
                        authorities.addAll(rolePermissionMap.get(firstOrgDto.getOrgRoleName()));
                    }

                    return OrganizationUserDTO.builder()
                            .id(firstOrgDto.getOrgId())
                            .name(firstOrgDto.getOrgName())
                            .displayName(firstOrgDto.getDisplayName())
                            .phone(firstOrgDto.getOrgPhone())
                            .address(firstOrgDto.getAddress())
                            .authorities(authorities)
                            .projects(projects)
                            .projectAgents(agents)
                            .createdAt(firstOrgDto.getOrgCreatedAt())
                            .updatedAt(firstOrgDto.getOrgUpdatedAt())
                            .build();
                }).collect(Collectors.toList());

        return userProfileBuilder.organizations(organizations.isEmpty() ? null : organizations).build();
    }
}
