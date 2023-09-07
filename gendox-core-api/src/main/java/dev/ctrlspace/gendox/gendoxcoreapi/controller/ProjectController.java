package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.ProjectConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ProjectDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.ProjectCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ProjectService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
public class ProjectController {

    private ProjectService projectService;

    private ProjectConverter projectConverter;

    @Autowired
    public ProjectController(ProjectService projectService,
                             ProjectConverter projectConverter) {
        this.projectService = projectService;
        this.projectConverter = projectConverter;
    }


    //    @PreAuthorize("@securityUtils.hasAuthorityToRequestedProjectId('id')")
    @GetMapping("/projects/{id}")
    public Project getById(@PathVariable UUID id) throws GendoxException {
        return projectService.getById(id);
    }


    //    @PreAuthorize("@securityUtils.hasAuthorityToRequestedOrgId('OP_READ_DOCUMENT') " +
//            "|| @securityUtils.hasAuthorityToAllRequestedProjectId()")
    @GetMapping("/projects")
    public Page<Project> getAll(@Valid ProjectCriteria criteria, Pageable pageable) throws GendoxException {
        if (pageable == null) {
            pageable = PageRequest.of(0, 100);
        }
        if (pageable.getPageSize() > 100) {
            throw new GendoxException("MAX_PAGE_SIZE_EXCEED", "Page size can't be more than 100", HttpStatus.BAD_REQUEST);
        }
        return projectService.getAll(criteria, pageable);
    }

    // TODO: preauthorize has OP_CREATE_PROJECT for the requested organization
    @PostMapping(value = "/projects", consumes = {"application/json"})
    @ResponseStatus(value = HttpStatus.CREATED)
    public Project createProject(@RequestBody ProjectDTO projectDTO, @Valid ProjectCriteria criteria) throws Exception {

        // OK TODO: validate that the user has access to the organization
        // OK TODO: All Orginizations ADMINS + the creator of the project becomes members of the project
        // TODO: set up default Agent (TBD the actual implementation)
//        throw new UnsupportedOperationException("Not implemented yet");

        Project project = projectConverter.toEntity(projectDTO);
        project = projectService.createProject(criteria, project);

        return project;
    }


    // TODO: preauthorize has OP_UPDATE_PROJECT for the requested organization
    // TODO: is member to the project
    @Operation(summary = "Update a project by id",
            //as technical writer add description by the above and below TODOs
            description = """
                    Update a project by id. The user has to be member of the project and had permission to update the project.
                    The organization id can't be changed once the project has been created.
                    Project agents will be updated in this endpoint.
                    Project members will be updated to the /projects/{id}/members endpoint (Get all by project id, add user, remove user)
                    """)
    @PutMapping("/projects/{id}")
    public Project updateProject(@PathVariable UUID id, @RequestBody ProjectDTO projectDTO) throws GendoxException {
        // ok TODO: Organization id can't be changed once the project has been created
        // TODO: Project agents will be updated in this endpoint
        // TODO: Project members will be updated to the /projects/{id}/members endpoint (Get all by project id, add user, remove user)
//        throw new UnsupportedOperationException("Not implemented yet");


        Project project = new Project();
        project = projectConverter.toEntity(projectDTO);


        if (!id.equals(projectDTO.getId())) {
            throw new GendoxException("PROJECT_ID_MISMATCH", "ID in path and ID in body are not the same", HttpStatus.BAD_REQUEST);
        }

        project = projectService.updateProject(project);

        return project;

    }

    // TODO: preauthorize has OP_DELETE_PROJECT for the requested organization
    // TODO: is member to the project
    @DeleteMapping("/projects/{id}")
    public void delete(@PathVariable UUID id) throws Exception {
//        throw new UnsupportedOperationException("Not implemented yet");
        projectService.deleteProject(id);
    }


}
