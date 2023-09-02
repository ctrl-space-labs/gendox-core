package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.model.Organization;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.OrganizationCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.services.OrganizationService;
import jakarta.validation.Valid;
import org.slf4j.LoggerFactory;
import org.slf4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
public class OrganizationController {

    Logger logger = LoggerFactory.getLogger(OrganizationController.class);

    private OrganizationService organizationService;
    private JwtEncoder jwtEncoder;

    @Autowired
    public OrganizationController(OrganizationService organizationService,
                                  JwtEncoder jwtEncoder){
        this.organizationService = organizationService;
        this.jwtEncoder = jwtEncoder;
    }


    @GetMapping("/organizations")
    public Page<Organization> getAllOrganizations(@Valid OrganizationCriteria critetia, Pageable pageable) throws Exception{

        //run code to get the organization from database
        return organizationService.getAllOrganizations(critetia, pageable);
    }



}
