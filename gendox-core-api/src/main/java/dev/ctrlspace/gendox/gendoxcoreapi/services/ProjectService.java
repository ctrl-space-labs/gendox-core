package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.ProjectConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ProjectDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.ProjectCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ProjectMemberRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ProjectRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.ProjectPredicates;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.AiModelConstants;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.OrganizationRolesConstants;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class ProjectService {

    private ProjectRepository projectRepository;

    private ProjectAgentService projectAgentService;
    private ProjectMemberService projectMemberService;
    private UserOrganizationService userOrganizationService;

    private ProjectConverter projectConverter;

    private ProjectMemberRepository projectMemberRepository;

    private TypeService typeService;

    private AuditLogsService auditLogsService;


    @Autowired
    public ProjectService(ProjectRepository projectRepository,
                          ProjectAgentService projectAgentService,
                          ProjectConverter projectConverter,
                          ProjectMemberService projectMemberService,
                          UserOrganizationService userOrganizationService,
                          ProjectMemberRepository projectMemberRepository,
                          TypeService typeService,
                          AuditLogsService auditLogsService) {
        this.projectRepository = projectRepository;
        this.projectAgentService = projectAgentService;
        this.projectConverter = projectConverter;
        this.projectMemberService = projectMemberService;
        this.userOrganizationService = userOrganizationService;
        this.projectMemberRepository = projectMemberRepository;
        this.typeService = typeService;
        this.auditLogsService = auditLogsService;
    }

    public Project getProjectById(UUID id) throws GendoxException {
        return projectRepository.findById(id)
                .orElseThrow(() -> new GendoxException("PROJECT_NOT_FOUND", "Project not found with id: " + id, HttpStatus.NOT_FOUND));
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

    public Project createProject(ProjectDTO projectDTO, String creatorUserId) throws Exception {

        Project project = projectConverter.toEntity(projectDTO);


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




























