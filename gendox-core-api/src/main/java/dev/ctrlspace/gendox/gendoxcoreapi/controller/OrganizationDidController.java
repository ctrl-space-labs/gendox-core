package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.OrganizationDidConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.OrganizationDid;
import dev.ctrlspace.gendox.gendoxcoreapi.model.WalletKey;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.OrganizationDidDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.WalletKeyDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.OrganizationDidCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.services.OrganizationDidService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
public class OrganizationDidController {

    OrganizationDidService organizationDidService;

    OrganizationDidConverter organizationDidConverter;

    @Autowired
    public OrganizationDidController(OrganizationDidService organizationDidService,
                                     OrganizationDidConverter organizationDidConverter) {
        this.organizationDidService = organizationDidService;
        this.organizationDidConverter = organizationDidConverter;
    }


    @GetMapping("organizations/{organizationId}/dids/{didId}")
    @Operation(summary = "Get organization did by ID",
            description = "Retrieve organization dids details by its unique ID.")
    public OrganizationDid getOrganizationDidById(@PathVariable UUID didId) throws GendoxException {
        return organizationDidService.getOrganizationDidById(didId);
    }

    @GetMapping("organizations/{organizationId}/dids")
    @Operation(summary = "Get all organization dids",
            description = "Retrieve a list of all organization dids based on the provided criteria")

    public Page<OrganizationDid> getAllOrganizationDids(@Valid OrganizationDidCriteria organizationDidCriteria, Pageable pageable) throws GendoxException {
        // override requested org id with the path variable
        if (pageable == null) {
            pageable = PageRequest.of(0, 100);
        }
        if (pageable.getPageSize() > 100) {
            throw new GendoxException("MAX_PAGE_SIZE_EXCEED", "Page size can't be more than 100", HttpStatus.BAD_REQUEST);
        }
        return organizationDidService.getAllOrganizationDids(organizationDidCriteria, pageable);
    }





    @DeleteMapping("organizations/{organizationId}/dids/{didId}")
    @Operation(summary = "Delete organization did",
            description = "Delete an existing organization did based on the provided ID")
    public void deleteOrganizationDid(@PathVariable UUID didId) throws GendoxException {
        organizationDidService.deleteOrganizationDid(didId);
    }

    @GetMapping("organizations/{organizationId}/dids/{didId}/export")
    @Operation(summary = "Export organization did",
            description = "Export an existing organization did based on the provided ID")
    public String exportOrganizationDid(@PathVariable UUID didId) throws GendoxException {
        return organizationDidService.exportOrganizationDid(didId);

    }



    @PostMapping(value = "/organizations/{organizationId}/dids", consumes = "application/json")
    @Operation(summary = "Create organization DID",
            description = "Create a new organization DID based on the provided details")
    public OrganizationDid createOrganizationDid(@PathVariable("organizationId") UUID organizationId, @RequestBody OrganizationDidDTO organizationDidDTO,
                                                 @RequestParam(value = "didType", required = true) String didType) throws GendoxException {


        if (organizationDidDTO.getId() != null) {
            throw new GendoxException("ORG_DID_ID_MUST_BE_NULL", "DID id must be null", HttpStatus.BAD_REQUEST);
        }

        if (!organizationId.equals(organizationDidDTO.getOrganizationId())) {
            throw new GendoxException("ORGANIZATION_ID_MISMATCH", "ID in path and ID in body are not the same", HttpStatus.BAD_REQUEST);
        }

        return organizationDidService.createOrganizationDid(organizationDidDTO, didType);

    }

    @PostMapping("/organizations/{organizationId}/dids/import-did")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Import DID",
            description = "Import a DID from a wallet app.")
    public OrganizationDid importDid(@PathVariable UUID organizationId,  @RequestBody OrganizationDidDTO organizationDidDTO) throws GendoxException, JsonProcessingException {

        return organizationDidService.importOrganizationDid(organizationDidDTO, organizationId);
    }
}
