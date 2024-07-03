package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectAgent;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.OrganizationUserDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.ProjectOrganizationDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.UserProfile;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.ProjectAgentCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.ProjectCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.request.ProjectAgentVPOfferRequest;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.ProjectAgentPredicates;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ProjectAgentService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.function.Predicate;

@RestController
public class ProjectAgentController {

    private ProjectAgentService projectAgentService;
    private SecurityUtils securityUtils;

    @Autowired
    public ProjectAgentController(ProjectAgentService projectAgentService,
                                  SecurityUtils securityUtils) {
        this.projectAgentService = projectAgentService;
        this.securityUtils = securityUtils;
    }



    @GetMapping("project-agents")
    @Operation(summary = "Get Project Agents by Criteria",
            description = "Retrieve a list of all project agents based on the provided criteria. The user must have the necessary permissions to access these projects.")

    public Page<ProjectAgent> getProjectAgentsByCriteria(@Valid ProjectAgentCriteria criteria, Pageable pageable) throws GendoxException {
        if (pageable == null) {
            pageable = PageRequest.of(0, 100);
        }
        if (pageable.getPageSize() > 100) {
            throw new GendoxException("MAX_PAGE_SIZE_EXCEED", "Page size can't be more than 100", HttpStatus.BAD_REQUEST);
        }

        return projectAgentService.getAllProjectAgents(criteria, pageable);
    }

    @PostMapping("/create-vp")
    public ResponseEntity<Object> createVerifiablePresentation(@RequestBody ProjectAgentVPOfferRequest projectAgentVPOfferRequest) throws GendoxException, IOException {
        Object verifiablePresentation = projectAgentService.createVerifiablePresentationOrg(projectAgentVPOfferRequest.getAgentVcJwt(), projectAgentVPOfferRequest.getSubjectKey(), projectAgentVPOfferRequest.getSubjectDid());
        return ResponseEntity.ok(verifiablePresentation);
    }







}
