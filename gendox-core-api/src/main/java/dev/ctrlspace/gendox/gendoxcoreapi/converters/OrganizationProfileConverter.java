package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.RolePermissionCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.services.RolePermissionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

@Component
public class OrganizationProfileConverter {

    @Autowired
    private RolePermissionService rolePermissionService;

    public UserProfile toDTO(List<OrganizationProfileProjectAgentDTO> dtos) throws GendoxException {
        if (dtos == null || dtos.isEmpty()) {
            return null;
        }

        // Extract user-related information (using the first DTO as a sample)
        OrganizationProfileProjectAgentDTO firstDto = dtos.get(0);

        Type userType = new Type();
        userType.setId(firstDto.getUserTypeId());
        userType.setName(firstDto.getUserTypeName());

        // Fetch permissions for the role
        Map<String, List<String>> rolePermissionMap = rolePermissionService.getRoleToPermissionMapping(
                RolePermissionCriteria.builder()
                        .roleIdIn(Collections.singletonList(firstDto.getOrgRoleId()))
                        .build()
        );

        // Group projects by project ID
        Map<String, List<OrganizationProfileProjectAgentDTO>> projectGrouped = dtos.stream()
                .filter(dto -> dto.getProjectId() != null)
                .collect(Collectors.groupingBy(OrganizationProfileProjectAgentDTO::getProjectId));

        List<ProjectOrganizationDTO> projects = projectGrouped.entrySet().stream()
                .map(entry -> {
                    List<OrganizationProfileProjectAgentDTO> projectDtos = entry.getValue();
                    OrganizationProfileProjectAgentDTO firstProjectDto = projectDtos.get(0);

                    return ProjectOrganizationDTO.builder()
                            .id(firstProjectDto.getProjectId())
                            .name(firstProjectDto.getProjectName())
                            .description(firstProjectDto.getProjectDescription())
                            .createdAt(firstProjectDto.getProjectCreatedAt())
                            .updatedAt(firstProjectDto.getProjectUpdatedAt())
                            .build();
                }).collect(Collectors.toList());

        // Collect agents
        List<ProjectAgentDTO> agents = dtos.stream()
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

        // Group organizations by organization ID
        Map<String, List<OrganizationProfileProjectAgentDTO>> orgGrouped = dtos.stream()
                .collect(Collectors.groupingBy(OrganizationProfileProjectAgentDTO::getOrgId));

        List<OrganizationUserDTO> organizations = orgGrouped.entrySet().stream()
                .map(entry -> {
                    List<OrganizationProfileProjectAgentDTO> orgDtos = entry.getValue();
                    OrganizationProfileProjectAgentDTO firstOrgDto = orgDtos.get(0);

                    // Set up organization user
                    Set<String> orgAuthorities = new HashSet<>();
                    orgAuthorities.add(firstOrgDto.getOrgRoleName());
                    if (rolePermissionMap.containsKey(firstOrgDto.getOrgRoleName())) {
                        orgAuthorities.addAll(rolePermissionMap.get(firstOrgDto.getOrgRoleName()));
                    }

                    return OrganizationUserDTO.builder()
                            .id(firstOrgDto.getOrgId())
                            .name(firstOrgDto.getOrgName())
                            .displayName(firstOrgDto.getDisplayName())
                            .phone(firstOrgDto.getOrgPhone())
                            .address(firstOrgDto.getAddress())
                            .authorities(orgAuthorities)
                            .projects(projects)
                            .projectAgents(agents)
                            .createdAt(firstOrgDto.getOrgCreatedAt())
                            .updatedAt(firstOrgDto.getOrgUpdatedAt())
                            .build();
                }).collect(Collectors.toList());

        return UserProfile.builder()
                .id(firstDto.getId())
                .globalUserRoleType(userType)
                .organizations(organizations.isEmpty() ? null : organizations)
                .build();
    }
}