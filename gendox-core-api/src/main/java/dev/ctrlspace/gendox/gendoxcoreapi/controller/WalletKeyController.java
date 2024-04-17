package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.WalletKeyConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import dev.ctrlspace.gendox.gendoxcoreapi.model.WalletKey;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.WalletKeyDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.ProjectCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.WalletKeyCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.services.WalletKeyService;
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
public class WalletKeyController {

    WalletKeyService walletKeyService;

    WalletKeyConverter walletKeyConverter;

    @Autowired
    public WalletKeyController(WalletKeyService walletKeyService,
                               WalletKeyConverter walletKeyConverter) {
        this.walletKeyService = walletKeyService;
        this.walletKeyConverter = walletKeyConverter;
    }


    @GetMapping("wallet/keys/{walletKeyId}")
    @Operation(summary = "Get wallet key by ID",
            description = "Retrieve wallet key details by its unique ID.")
    public WalletKey getWalletKeyById(@PathVariable UUID walletKeyId) throws GendoxException {
        return walletKeyService.getWalletKeybyId(walletKeyId);
    }


    @GetMapping("wallet/keys")
    @Operation(summary = "Get all wallet keys",
            description = "Retrieve a list of all wallet keys based on the provided criteria")

    public Page<WalletKey> getAllWalletKeys(@Valid WalletKeyCriteria walletKeyCriteria, Pageable pageable) throws GendoxException {
        // override requested org id with the path variable
        if (pageable == null) {
            pageable = PageRequest.of(0, 100);
        }
        if (pageable.getPageSize() > 100) {
            throw new GendoxException("MAX_PAGE_SIZE_EXCEED", "Page size can't be more than 100", HttpStatus.BAD_REQUEST);
        }
        return walletKeyService.getAllWalletKeys(walletKeyCriteria, pageable);
    }

    @PostMapping(value = "wallet/keys", consumes = "application/json")
    @ResponseStatus(value = HttpStatus.CREATED)
    @Operation(summary = "Create wallet key",
            description = "Create a new wallet key with the provided details.")
    public WalletKey createWalletKey(@RequestBody WalletKeyDTO walletKeyDTO) throws GendoxException {

        if (walletKeyDTO.getId() != null) {
            throw new GendoxException("WALLET_KEY_ID_MUST_BE_NULL", "Key id is not null", HttpStatus.BAD_REQUEST);
        }

        WalletKey walletKey = walletKeyConverter.toEntity(walletKeyDTO);
        walletKey = walletKeyService.createWalletKey(walletKey);


        return walletKey;
    }

    @PutMapping("wallet/keys/{walletKeyId}")
    @Operation(summary = "Update wallet key",
            description = "Update an existing wallet key with the provided details.")
    public WalletKey updateWalletKey(@PathVariable UUID walletKeyId, @RequestBody WalletKeyDTO walletKeyDTO) throws GendoxException {
        WalletKey walletKey = walletKeyConverter.toEntity(walletKeyDTO);
        walletKey.setId(walletKeyId);
        if (!walletKeyId.equals(walletKey.getId())) {
            throw new GendoxException("Key's_ID_MISMATCH", "Key's ID in path and ID in body are not the same", HttpStatus.BAD_REQUEST);
        }
        walletKey = walletKeyService.updateWalletKey(walletKey);
        return walletKey;
    }

    @DeleteMapping("wallet/keys/{walletKeyId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete wallet key",
            description = "Delete an existing wallet key by its unique ID.")
    public void deleteWalletKey(@PathVariable UUID walletKeyId) throws GendoxException {
        walletKeyService.deleteWalletKey(walletKeyId);
    }

    @GetMapping("wallet/keys/{walletKeyId}/export-jwk")
    public String exportWalletKeyJwk(@PathVariable UUID walletKeyId) throws GendoxException {
        return walletKeyService.exportWalletKeyJwk(walletKeyId);
    }



}
