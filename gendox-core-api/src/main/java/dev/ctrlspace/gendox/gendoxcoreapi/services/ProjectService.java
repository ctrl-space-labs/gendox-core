package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectAgent;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.ProjectCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ProjectRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.ProjectPredicates;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
public class ProjectService {

    private ProjectRepository projectRepository;
    private ProjectMemberService projectMemberService;
    private SecurityUtils securityUtils;


    @Autowired
    public ProjectService(ProjectRepository projectRepository,
                          ProjectMemberService projectMemberService,
                          SecurityUtils securityUtils) {
        this.projectRepository = projectRepository;
        this.projectMemberService = projectMemberService;
        this.securityUtils = securityUtils;
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

    public Project createProject(Project project) throws Exception {
        Instant now = Instant.now();

        project.setCreatedAt(now);
        project.setUpdatedAt(now);
        project.setCreatedBy(securityUtils.getUserId());
        project.setUpdatedBy(securityUtils.getUserId());

        project = projectRepository.save(project);


        // Project's Admins & Creator become members of the project
        projectMemberService.addDefaultMembersToTheProject(project, project.getOrganizationId());

        return project;

    }


    public Project updateProject(Project project) throws GendoxException {

        project.setUpdatedAt(Instant.now());
        project.setUpdatedBy(securityUtils.getUserId());
        project = projectRepository.save(project);

        return project;

    }


    public void deleteProject(UUID id) throws Exception {

        Project project = this.getProjectById(id);
        projectMemberService.deleteAllProjectMembers(project);
        projectRepository.delete(project);

    }


}




























