package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.WalletKeyConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import dev.ctrlspace.gendox.gendoxcoreapi.model.WalletKey;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.WalletKeyDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.ProjectCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.WalletKeyCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.request.CreateWalletKeysRequestBody;
import dev.ctrlspace.gendox.gendoxcoreapi.services.WalletKeyService;
import id.walt.crypto.keys.KeyType;
import id.walt.crypto.keys.LocalKey;
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


    @GetMapping("/organizations/{organizationId}/wallet-keys/{walletKeyId}")
    @Operation(summary = "Get wallet key by ID",
            description = "Retrieve wallet key details by its unique ID.")
    public WalletKeyDTO  getWalletKeyById(@PathVariable UUID walletKeyId) throws GendoxException, JsonProcessingException {
        WalletKey walletKey = walletKeyService.getWalletKeybyId(walletKeyId);
        return walletKeyConverter.toDTO(walletKey);
    }


    @GetMapping("/organizations/{organizationId}/wallet-keys")
    @Operation(summary = "Get all wallet keys",
            description = "Retrieve a list of all wallet keys based on the provided criteria")

    public Page<WalletKeyDTO> getAllWalletKeys(@Valid WalletKeyCriteria walletKeyCriteria, Pageable pageable) throws GendoxException {
        // override requested org id with the path variable
        if (pageable == null) {
            pageable = PageRequest.of(0, 100);
        }
        if (pageable.getPageSize() > 100) {
            throw new GendoxException("MAX_PAGE_SIZE_EXCEED", "Page size can't be more than 100", HttpStatus.BAD_REQUEST);
        }

        Page<WalletKey> walletKeyPage = walletKeyService.getAllWalletKeys(walletKeyCriteria, pageable);

        // Map WalletKey to WalletKeyDTO
        return walletKeyPage.map(walletKey -> {
            try {
                return walletKeyConverter.toDTO(walletKey);
            } catch (JsonProcessingException e) {
                // Handle the exception if needed
                e.printStackTrace(); // Example: Print the stack trace
                // Return a default or error DTO
                return new WalletKeyDTO();
            }
        });
    }

    @PostMapping(value = "/organizations/{organizationId}/wallet-keys", consumes = {"application/json"})
    @ResponseStatus(value = HttpStatus.CREATED)
    @Operation(summary = "Create wallet key",
            description = "Create a new wallet key with the provided details.")
    public WalletKey createWalletKey(@RequestBody CreateWalletKeysRequestBody walletKeysRequestBody) throws GendoxException {

        WalletKeyDTO walletKeyDTO = walletKeysRequestBody.getWalletKeyDTO();
        LocalKey localKey = walletKeysRequestBody.getLocalKey();

        if (walletKeyDTO.getId() != null) {
            throw new GendoxException("WALLET_KEY_ID_MUST_BE_NULL", "Key id is not null", HttpStatus.BAD_REQUEST);
        }

        WalletKey walletKey = walletKeyConverter.toEntity(walletKeyDTO);
        walletKey = walletKeyService.createWalletKey(walletKey, localKey);

        return walletKey;
    }


    @DeleteMapping("/organizations/{organizationId}/wallet-keys/{walletKeyId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete wallet key",
            description = "Delete an existing wallet key by its unique ID.")
    public void deleteWalletKey(@PathVariable UUID walletKeyId) throws GendoxException {
        walletKeyService.deleteWalletKey(walletKeyId);
    }

    @GetMapping("/organizations/{organizationId}/wallet-keys/{walletKeyId}/export-jwk")
    public String exportWalletKeyJwk(@PathVariable UUID walletKeyId) throws GendoxException {
        return walletKeyService.exportWalletKeyJwk(walletKeyId);
    }

    @GetMapping("/organizations/wallet-keys/generate-local-key")
    public LocalKey generateLocalKey( @RequestParam String keyTypeName,
                                      @RequestParam(required = false) Integer characterLength) throws GendoxException {
        return walletKeyService.generateLocalKey(keyTypeName, characterLength);
    }




    @PostMapping("/organizations/{organizationId}/wallet-keys/import-jwk")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Import wallet key",
            description = "Import a new wallet key with the provided details.")
        public WalletKeyDTO importWalletKey(@PathVariable UUID organizationId, @RequestBody LocalKey localKey) throws GendoxException, JsonProcessingException {
            // Call the service method to import the wallet key
            WalletKey walletKey = walletKeyService.importWalletKey(localKey, organizationId);

            // Convert the wallet key entity to DTO
            WalletKeyDTO walletKeyDTO = walletKeyConverter.toDTO(walletKey);

            return walletKeyDTO;
        }
}
