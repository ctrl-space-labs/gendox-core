package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.model.Organization;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectAgent;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.OrganizationUserDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Set;

@Component
public class OrganizationUserConverter {

    @Autowired
    private ProjectUserConverter projectUserConverter;

    @Autowired
    private AgentUserConverter agentUserConverter;

    public OrganizationUserDTO toDTO(Organization organization, Set<String> userAuthorities, List<Project> projectAuthorities, List<ProjectAgent> agentAuthorities) {
        return OrganizationUserDTO
                .builder()
                .id(String.valueOf(organization.getId()))
                .name(organization.getName())
                .displayName(organization.getDisplayName())
                .phone(organization.getPhone())
                .address(organization.getAddress())
                .authorities(userAuthorities)
                .projects(projectAuthorities
                        .stream()
                        .map(project ->
                                projectUserConverter.toDTO(project)).toList()
                )
                .projectAgents(agentAuthorities
                        .stream()
                        .map(projectAgent ->
                                agentUserConverter.toDTO(projectAgent)).toList())
                .createdAt(organization.getCreatedAt())
                .updatedAt(organization.getUpdatedAt())
                .build();

    }
}
