package dev.ctrlspace.gendox.gendoxcoreapi.services;

import com.querydsl.core.types.Predicate;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import dev.ctrlspace.gendox.gendoxcoreapi.model.User;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.ProjectCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ProjectRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.ProjectPredicates;
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

    @Autowired
    public ProjectService(ProjectRepository projectRepository,
                          ProjectMemberService projectMemberService) {
        this.projectRepository = projectRepository;
        this.projectMemberService = projectMemberService;
    }

    public Project getById(UUID id) throws GendoxException {
        return projectRepository.findById(id)
                .orElseThrow(() -> new GendoxException("PROJECT_NOT_FOUND", "Project not found with id: " + id, HttpStatus.NOT_FOUND));
    }

    public Page<Project> getAll(ProjectCriteria criteria) throws GendoxException {
        return this.getAll(criteria, PageRequest.of(0, 100));
    }

    public Page<Project> getAll(ProjectCriteria criteria, Pageable pageable) throws GendoxException {
        if (pageable == null) {
            throw new GendoxException("Pageable cannot be null", "pageable.null", HttpStatus.BAD_REQUEST);
        }
        return projectRepository.findAll(ProjectPredicates.build(criteria), pageable);
    }

    public Project createProject(ProjectCriteria criteria, Project project) throws Exception {
        Instant now = Instant.now();

        if (project.getId() != null) {
            throw new GendoxException("NEW_PROJECT_ID_IS_NOT_NULL", "Project id must be null", HttpStatus.BAD_REQUEST);
        }

        // Validate the criteria here based on your requirements
        Predicate predicate = ProjectPredicates.build(criteria);

        // Check if the criteria matches any existing projects
        boolean criteriaMatchesExistingProjects = projectRepository.exists(predicate);

        if (!criteriaMatchesExistingProjects) {
            throw new GendoxException("PROJECT_CRITERIA_DOES_NOT_MATCH_EXISTING", "The criteria do not match any existing projects", HttpStatus.BAD_REQUEST);
        }

        project.setCreatedAt(now);
        project.setUpdatedAt(now);

        project = projectRepository.save(project);



        // Project's Admins & Creator become members of the project
        projectMemberService.setMemberRoleToProjects(project, project.getOrganizationId());




        return project;

    }


    public Project updateProject(Project project) throws GendoxException {
        UUID projectId = project.getId();
        Project existingProject = this.getById(projectId);

        // Update the properties of the existingOrganization with the values from the updated organization
        existingProject.setName(project.getName());
        existingProject.setDescription(project.getDescription());
        existingProject.setUpdatedAt(Instant.now());




        existingProject = projectRepository.save(existingProject);

        return existingProject;

    }




    public void deleteProject(UUID id) throws Exception {
        Project project = projectRepository.findById(id).orElse(null);

        if (project != null) {
            projectMemberService.deleteProjectMember(project);
            projectRepository.deleteById(id);
        } else {
            throw new GendoxException("PROJECT_NOT_FOUND", "Project not found with id: " + id, HttpStatus.NOT_FOUND);

        }

    }


}




























