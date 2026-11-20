package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ClientConfigDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ClientConfigService;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ClientConfigController {

    private final ClientConfigService clientConfigService;

    public ClientConfigController(ClientConfigService clientConfigService) {
        this.clientConfigService = clientConfigService;
    }

    @GetMapping("/public/client-config")
    @Operation(summary = "Client configuration",
            description = "Public. The API URL, sign-in server, desktop client ID and versions a client such as the desktop app needs before sign-in.")
    public ClientConfigDTO getClientConfig() {
        return clientConfigService.getClientConfig();
    }
}
