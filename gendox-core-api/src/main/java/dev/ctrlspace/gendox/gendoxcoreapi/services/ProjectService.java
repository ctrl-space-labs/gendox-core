package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.ProjectConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ProjectDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.ProjectCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ProjectRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.ProjectPredicates;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.OrganizationRolesConstants;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class ProjectService {

    // The project's name becomes the agent's Keycloak username, and Keycloak accepts only letters, digits and + @ . _ - there.
    private static final Pattern UNSUPPORTED_NAME_CHARS = Pattern.compile("[^\\p{L}\\p{N}+@._\\s-]");

    private ProjectRepository projectRepository;
    private ProjectAgentService projectAgentService;
    private ProjectMemberService projectMemberService;
    private UserOrganizationService userOrganizationService;
    private ProjectConverter projectConverter;
    private TypeService typeService;
    private AuditLogsService auditLogsService;
    private SubscriptionValidationService subscriptionValidationService;


    @Autowired
    public ProjectService(ProjectRepository projectRepository,
                          ProjectAgentService projectAgentService,
                          ProjectConverter projectConverter,
                          ProjectMemberService projectMemberService,
                          UserOrganizationService userOrganizationService,
                          TypeService typeService,
                          AuditLogsService auditLogsService,
                          SubscriptionValidationService subscriptionValidationService) {
        this.projectRepository = projectRepository;
        this.projectAgentService = projectAgentService;
        this.projectConverter = projectConverter;
        this.projectMemberService = projectMemberService;
        this.userOrganizationService = userOrganizationService;
        this.typeService = typeService;
        this.auditLogsService = auditLogsService;
        this.subscriptionValidationService = subscriptionValidationService;
    }

    public Project getProjectById(UUID id) throws GendoxException {
        return projectRepository.findById(id)
                .orElseThrow(() -> new GendoxException("PROJECT_NOT_FOUND", "Project not found with id: " + id, HttpStatus.NOT_FOUND));
    }

    public void validateProjectsBelongToOrganization(Collection<UUID> projectIds, UUID organizationId) throws GendoxException {
        if (projectIds.contains(null)
                || projectRepository.countByIdInAndOrganizationId(projectIds, organizationId) != projectIds.size()) {
            throw new GendoxException("PROJECT_ORGANIZATION_MISMATCH",
                    "All projects must belong to the requested organization", HttpStatus.FORBIDDEN);
        }
    }

    public Page<Project> getAllProjects(ProjectCriteria criteria) throws GendoxException {
        return this.getAllProjects(criteria, PageRequest.of(0, 100));
    }

    public Page<Project> getAllProjects(ProjectCriteria criteria, Pageable pageable) throws GendoxException {
        if (pageable == null) {
            throw new GendoxException("Pageable cannot be null", "pageable.null", HttpStatus.BAD_REQUEST);
        }
        return projectRepository.findAll(ProjectPredicates.build(criteria), pageable);
    }

    private void validateProjectName(String name) throws GendoxException {
        Matcher matcher = UNSUPPORTED_NAME_CHARS.matcher(name == null ? "" : name);
        String found = matcher.results()
                .map(match -> match.group())
                .distinct()
                .collect(Collectors.joining(" "));

        if (!found.isEmpty()) {
            throw new GendoxException("INVALID_PROJECT_NAME",
                    "Project name cannot contain " + found + ". Only letters, numbers, spaces and + @ . _ - are supported.",
                    HttpStatus.BAD_REQUEST);
        }
    }

    public Project createProject(ProjectDTO projectDTO, String creatorUserId) throws Exception {

        Project project = projectConverter.toEntity(projectDTO);

        validateProjectName(project.getName());

        // Check if the organization has reached the maximum number of projects allowed
        if (!subscriptionValidationService.canCreateProjects(project.getOrganizationId())) {
            throw new GendoxException("MAX_PROJECTS_REACHED", "Maximum number of projects reached for this organization", HttpStatus.BAD_REQUEST);
        }


        ProjectAgent projectAgent = projectAgentService.createProjectAgent(project.getProjectAgent());

        project.setActive(true);

        project.setProjectAgent(projectAgent);

        project = projectRepository.save(project);

        // Project agent become user of organization
        userOrganizationService.createUserOrganization(project.getProjectAgent().getUserId(), project.getOrganizationId(), OrganizationRolesConstants.READER);

        // Project Agent become members of the project
        projectMemberService.createProjectMember(project.getProjectAgent().getUserId(), project.getId());

        // Project's Admins & Creator become members of the project
        projectMemberService.addDefaultMembersToTheProject(project, project.getOrganizationId(), creatorUserId);

        return project;

    }


    public Project updateProject(Project project) throws GendoxException {

        project = projectRepository.save(project);

        return project;

    }


    public void deactivateProject(UUID id) throws GendoxException {
        Project project = this.getProjectById(id);

        // Delete other associated data
        projectMemberService.deleteAllProjectMembers(project);
        clearProjectData(project);
        projectRepository.save(project);
        Type deleteProjectType = typeService.getAuditLogTypeByName("DELETE_PROJECT");
        AuditLogs deleteProjectAuditLogs = auditLogsService.createDefaultAuditLogs(deleteProjectType);
        deleteProjectAuditLogs.setOrganizationId(project.getOrganizationId());
        deleteProjectAuditLogs.setProjectId(id);
        auditLogsService.saveAuditLogs(deleteProjectAuditLogs);

    }

    private void clearProjectData(Project project) {
        project.setName("DEACTIVATED");
        project.setDescription(null);
        project.setAutoTraining(null);
        project.setUpdatedAt(null);
        project.setCreatedAt(null);
        project.setCreatedBy(null);
        project.setUpdatedBy(null);
        project.setActive(false);


    }


}




























